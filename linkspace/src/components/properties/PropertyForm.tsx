"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2 } from "lucide-react";

export function PropertyForm({ initialData }: { initialData?: any }) {
    const router = useRouter();
    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    
    const isEditMode = !!initialData;
    
    // フォーム状態
    const [title, setTitle] = useState(initialData?.title || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [address, setAddress] = useState(initialData?.address || "");
    const [price, setPrice] = useState<number>(initialData?.price_per_day || 0);
    const [tagsText, setTagsText] = useState(initialData?.tags?.join(", ") || "");
    const [rules, setRules] = useState(initialData?.rules || "");
    const [isPublished, setIsPublished] = useState<boolean>(initialData ? initialData.is_published : true);
    
    // 画像状態
    const [images, setImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    
    // 既存画像
    const existingImages = initialData?.property_images?.map((img: any) => img.image_url) || [];

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        
        const selectedFiles = Array.from(e.target.files);
        // 今回はとりあえず最大10枚程度までとする
        if (images.length + selectedFiles.length > 10) {
            setMessage("画像は最大10枚までです。");
            return;
        }

        const newImages = [...images, ...selectedFiles];
        setImages(newImages);

        // プレビューURL生成
        const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
        setPreviewUrls([...previewUrls, ...newPreviews]);
        
        // 入力をリセット（同じファイルを追加できるように）
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);

        const newPreviews = [...previewUrls];
        URL.revokeObjectURL(newPreviews[index]); // メモリ解放
        newPreviews.splice(index, 1);
        setPreviewUrls(newPreviews);
    };

    const handleDelete = async () => {
        if (!isEditMode || !initialData.id) return;
        if (!confirm("本当にこの物件を削除しますか？この操作は取り消せません。")) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('properties')
                .delete()
                .eq('id', initialData.id);

            if (error) throw error;
            
            alert("物件を削除しました。");
            router.push('/mypage');
        } catch (error: any) {
            console.error("削除エラー:", error);
            setMessage("削除に失敗しました: " + error.message);
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError || !userData.user) throw new Error("ユーザー情報の取得に失敗しました。ログインし直してください。");

            const userId = userData.user.id;
            const tagsArray = tagsText.split(',').map(tag => tag.trim()).filter(tag => tag !== "");

            let propertyId = initialData?.id;

            if (isEditMode) {
                // 1. propertiesテーブルをUpdate
                const { error: propertyError } = await supabase
                    .from('properties')
                    .update({
                        title,
                        description,
                        address,
                        price_per_day: price,
                        tags: tagsArray,
                        rules,
                        is_published: isPublished
                    })
                    .eq('id', propertyId);

                if (propertyError) throw new Error(`物件の更新に失敗しました: ${propertyError.message}`);
            } else {
                // 1. propertiesテーブルにInsert
                const { data: propertyData, error: propertyError } = await supabase
                    .from('properties')
                    .insert({
                        owner_id: userId,
                        title,
                        description,
                        address,
                        price_per_day: price,
                        tags: tagsArray,
                        rules,
                        is_published: isPublished
                    })
                    .select()
                    .single();

                if (propertyError) throw new Error(`物件の登録に失敗しました: ${propertyError.message}`);
                propertyId = propertyData.id;
            }

            // 2. 画像の処理
            // 新しい画像が選択された場合のみ、古い画像を消して新しく登録する（簡易実装）
            if (images.length > 0) {
                if (isEditMode) {
                    // 既存のレコードを削除 (実際のStorageオブジェクト削除は今回省略またはRLSとトリガーに任せる形でも良いが、DBから消せば表示されなくなる)
                    await supabase.from('property_images').delete().eq('property_id', propertyId);
                }

                for (let i = 0; i < images.length; i++) {
                    const file = images[i];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${userId}/${propertyId}/${crypto.randomUUID()}.${fileExt}`;

                    // Storageへアップロード
                    const { error: uploadError } = await supabase.storage
                        .from('property-images')
                        .upload(fileName, file);

                    if (uploadError) {
                        console.error("画像アップロードエラー:", uploadError);
                        continue;
                    }

                    // 公開URLを取得
                    const { data: publicUrlData } = supabase.storage
                        .from('property-images')
                        .getPublicUrl(fileName);

                    // property_imagesへInsert
                    await supabase
                        .from('property_images')
                        .insert({
                            property_id: propertyId,
                            image_url: publicUrlData.publicUrl,
                            display_order: i
                        });
                }
            }

            setMessage(isEditMode ? "物件情報を更新しました！" : "物件の登録が完了しました！");
            router.push('/mypage'); 
        } catch (error: any) {
            console.error(error);
            setMessage(error.message || "エラーが発生しました。");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6 bg-card rounded-xl border shadow-sm">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{isEditMode ? "物件情報の編集" : "新規物件の登録"}</h2>
                {isEditMode && (
                    <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
                        この物件を削除
                    </Button>
                )}
            </div>

            {message && (
                <div className={`p-3 rounded-md text-sm ${message.includes('エラー') || message.includes('失敗') ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                    {message}
                </div>
            )}

            <div className="space-y-4">
                {/* ステータス */}
                <div>
                    <label className="block text-sm font-medium mb-1">公開ステータス</label>
                    <select 
                        value={isPublished ? "true" : "false"} 
                        onChange={(e) => setIsPublished(e.target.value === "true")}
                        className="w-full rounded-md border p-2 bg-background"
                    >
                        <option value="true">公開（検索や一覧に表示されます）</option>
                        <option value="false">非公開・下書き（他のユーザーからは見えません）</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">タイトル <span className="text-destructive">*</span></label>
                    <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-md border p-2" placeholder="例: 富士山が見える広々キャンプ用地" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">説明 <span className="text-destructive">*</span></label>
                    <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full rounded-md border p-2" placeholder="物件の特徴やアピールポイントを記入してください" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">住所 <span className="text-destructive">*</span></label>
                    <input required type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full rounded-md border p-2" placeholder="例: 山梨県〇〇市〇〇町1-2-3" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">1日あたりの価格 (LP) <span className="text-destructive">*</span></label>
                    <input required type="number" min="0" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full rounded-md border p-2" />
                    <p className="text-xs text-muted-foreground mt-1">※LinkPoints(LP)での決済額となります。</p>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">タグ</label>
                    <input type="text" value={tagsText} onChange={e => setTagsText(e.target.value)} className="w-full rounded-md border p-2" placeholder="例: キャンプ, テントサウナ, 駐車場 (カンマ区切り)" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">ルール・注意事項</label>
                    <textarea value={rules} onChange={e => setRules(e.target.value)} rows={3} className="w-full rounded-md border p-2" placeholder="例: 直火NG、ゴミは必ず持ち帰ること" />
                </div>

                {/* 画像アップロード */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        物件画像 (最大10枚)
                    </label>
                    
                    {isEditMode && existingImages.length > 0 && images.length === 0 && (
                        <div className="mb-4">
                            <p className="text-xs text-muted-foreground mb-2">現在登録されている画像（新しく画像を追加すると、これらはすべて上書きされます）</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {existingImages.map((url: string, idx: number) => (
                                    <div key={idx} className="relative aspect-square rounded-md overflow-hidden border">
                                        <img src={url} alt={`Existing ${idx}`} className="object-cover w-full h-full opacity-70" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {previewUrls.map((url, idx) => (
                            <div key={idx} className="relative aspect-square rounded-md overflow-hidden border border-primary">
                                <img src={url} alt={`Preview ${idx}`} className="object-cover w-full h-full" />
                                <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70">
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                        
                        {images.length < 10 && (
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
                                <ImagePlus size={24} className="mb-2" />
                                <span className="text-xs font-medium">{images.length > 0 ? "さらに追加" : "新しい画像を選択"}</span>
                            </button>
                        )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" multiple className="hidden" />
                </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 text-lg font-bold">
                {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {isEditMode ? "更新中..." : "登録中..."}</> : (isEditMode ? "変更を保存する" : "物件を登録する")}
            </Button>
        </form>
    );
}
