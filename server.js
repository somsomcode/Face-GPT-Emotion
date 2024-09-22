// Express 및 OpenAI 설정
const express = require("express");
const cors = require("cors"); // CORS 미들웨어 추가
const OpenAI = require("openai"); // 최신 OpenAI SDK 가져오기
require("dotenv").config();

const app = express();
const port = 3000; // 원하는 포트 번호 설정

// CORS 설정 (모든 도메인 허용)
app.use(cors());

// OpenAI API 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // .env 파일에 OpenAI API 키 저장
});

// JSON 파싱 미들웨어 설정
app.use(express.json());

// GPT-4 감정 분석 엔드포인트
app.post("/gpt", async (req, res) => {
  const userInput = req.body.text;

  if (!userInput) {
    return res.status(400).json({ error: "No input provided" });
  }

  try {
    // GPT-4에 감정 분석을 요청하는 프롬프트 추가
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `사용자의 다음 발언에서 감정을 분석하고 결과를 요약하세요: "${userInput}" 가능한 감정은 neutral, happy, angry, disgusted, sad, surprised, fearful 입니다. 
          Emotion : ,  cause: , 형식으로 답변해주세요.`,
        },
      ],
      max_tokens: 150,
    });

    const gptResponse = completion.choices[0].message.content.trim();
    res.json({ response: gptResponse });
  } catch (error) {
    if (error.response) {
      console.error(
        "OpenAI API Error:",
        error.response.status,
        error.response.data
      );
    } else {
      console.error("Error from OpenAI API:", error.message);
    }
    res.status(500).json({ error: "Failed to fetch GPT response" });
  }
});

// 서버 실행
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
