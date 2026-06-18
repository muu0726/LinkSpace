"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

import Link from "next/link";

export function AuthForm({ mode = "login" }: { mode?: "login" | "signup" }) {
    const isLogin = mode === "login";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [agreed, setAgreed] = useState(false);

    const supabase = createClient();

    //新規登録処理
    const handleSignUp = async () => {
        setLoading(true);
        setMessage("");

        //プロフィール名が空にならないように、仮でメールアドレスの＠より前を使用
        const defaultName = email.split('@')[0];

        const { error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
                data: {
                    name: defaultName,
                    terms_agreed: agreed,
                }
            }
        });

        if (error) {
            setMessage(`エラー: ${error.message}`);
        } else {
            setMessage("アカウントを作成し、ログインしました！");
            //成功時はトップページ等をリロードしてセッションを反映
            window.location.href = "/";
        }
        setLoading(false);
    };

    //ログイン処理
    const handleLogin = async () => {
        setLoading(true);
        setMessage("");

        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });

        if (error) {
            setMessage(`エラー: ${error.message}`);
        } else {
            setMessage("ログインしました！");
            window.location.href = "/";
        }
        setLoading(false);
    };

    return (
        <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-6 shadow-sm">
            <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    {isLogin ? "ログイン" : "新規登録"}
                </h2>
                <p className="text-sm text-muted-foreground">
                    メールアドレスとパスワード（６文字以上）を入力してください。
                </p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                        メールアドレス
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="test@example.com"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                        パスワード
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10"
                            placeholder="6文字以上"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>
            </div>

            {!isLogin && (
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="terms"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                    />
                    <label htmlFor="terms" className="text-sm text-muted-foreground">
                        利用規約およびプライバシーポリシーに同意する
                    </label>
                </div>
            )}




            {message && (
                <div className="text-sm font-medium text-center text-destructive">
                    {message}
                </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
                {isLogin ? (
                    <>
                        <Button
                            onClick={handleLogin}
                            disabled={loading || !email || !password}
                            className="w-full"
                        >
                            {loading ? "処理中..." : "ログイン"}
                        </Button>
                        <div className="text-center text-sm text-muted-foreground mt-2">
                            アカウントをお持ちでないですか？{" "}
                            <Link href="/signup" className="text-primary hover:underline">
                                新規登録はこちら
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        <Button
                            onClick={handleSignUp}
                            disabled={loading || !email || !password || !agreed}
                            className="w-full"
                        >
                            {loading ? "処理中..." : "新規登録"}
                        </Button>
                        <div className="text-center text-sm text-muted-foreground mt-2">
                            既にアカウントをお持ちですか？{" "}
                            <Link href="/login" className="text-primary hover:underline">
                                ログインはこちら
                            </Link>
                        </div>
                    </>
                )}
            </div>

        </div>
    );
}