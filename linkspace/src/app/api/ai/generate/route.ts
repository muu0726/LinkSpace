import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { type, title, address, tags, keywords, imageBase64 } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Google Gemini APIキーが設定されていません。(.env.localを確認してください)" },
        { status: 500 }
      );
    }

    let promptText = "";
    if (type === 'description') {
      promptText = `以下の情報を元に、空き家・空き地貸し出しプラットフォーム向けの魅力的な物件紹介文を作成してください。
出力は紹介文のテキストのみとしてください。Markdownなどは使わず、そのままテキストエリアに入力できるプレーンテキストで出力してください。
挨拶や「はい、作成します」などの前置きは不要です。

【タイトル】: ${title || "未設定"}
【住所】: ${address || "未設定"}
【タグ】: ${tags || "未設定"}
【特徴・追加キーワード】: ${keywords || "なし"}`;
    } else if (type === 'rules') {
      promptText = `以下の情報を元に、空き家・空き地貸し出しプラットフォーム向けの物件利用ルール・注意事項の草案を作成してください。
出力はルールのテキストのみとしてください。箇条書き等のプレーンテキストで出力し、挨拶や「はい、作成します」などの前置きは省いてください。

【タイトル】: ${title || "未設定"}
【タグ】: ${tags || "未設定"}
【特徴・追加キーワード】: ${keywords || "なし"}`;
    } else {
      return NextResponse.json(
        { success: false, error: "不正なリクエストタイプです。" },
        { status: 400 }
      );
    }

    const parts: any[] = [{ text: promptText }];

    // 画像が送信された場合は添付する
    if (imageBase64) {
      const match = imageBase64.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        parts.push({
          inline_data: {
            mime_type: mimeType,
            data: base64Data
          }
        });
      }
    }

    const requestBody = {
      contents: [{ parts }]
    };

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Gemini API Error:", errorText);
      return NextResponse.json(
        { success: false, error: "AIによる生成に失敗しました。時間をおいて再度お試しください。" },
        { status: 500 }
      );
    }

    const data = await res.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return NextResponse.json(
        { success: false, error: "生成結果が空でした。" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: generatedText.trim() });
  } catch (error: any) {
    console.error("AI Generation API Error:", error);
    return NextResponse.json(
      { success: false, error: "サーバー内部でエラーが発生しました。" },
      { status: 500 }
    );
  }
}
