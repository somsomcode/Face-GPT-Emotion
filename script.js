let faceapi;
let detections = [];
let countdown;
let recognitionTimeout;
let finalEmotionData = {};
let expressionDataArray = []; // 30초 동안 감지된 표정 데이터를 저장할 배열

const video = document.getElementById("videoInput");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const recognizedTextElement = document.getElementById("recognizedText");
const expressionResultElement = document.getElementById("expressionResult");
const finalExpressionResultElement = document.getElementById(
  "finalExpressionResult"
);
const timerElement = document.getElementById("timer");
const gptResponseElement = document.getElementById("gptResponse");

// 음성 인식 설정
const recognition = new (window.SpeechRecognition ||
  window.webkitSpeechRecognition)();
recognition.lang = "ko-KR";
recognition.continuous = true;
recognition.interimResults = false;

// 음성 인식이 시작되면 호출되는 함수
startButton.addEventListener("click", () => {
  recognition.start();
  startButton.disabled = true;
  stopButton.disabled = false;
  expressionDataArray = []; // 표정 데이터 배열 초기화
  startCountdown(); // 타이머 시작
  startFaceRecognition(); // 표정 인식 시작
});

// 음성 인식 중지
stopButton.addEventListener("click", () => {
  stopRecognition();
});

recognition.onresult = (event) => {
  const lastResult = event.results[event.results.length - 1];
  const recognizedText = lastResult[0].transcript;
  recognizedTextElement.innerText = recognizedText;
  finalEmotionData.speech = recognizedText; // 음성 데이터를 저장
  sendTextToGPT(recognizedText); // GPT에 텍스트 전송
};

// 음성 인식을 중지하는 함수
function stopRecognition() {
  recognition.stop();
  clearTimeout(recognitionTimeout);
  clearInterval(countdown);
  timerElement.innerText = 30;
  startButton.disabled = false;
  stopButton.disabled = true;
  analyzeFinalEmotion(); // 감정 분석 종합
}

// 타이머 시작 함수 (30초 카운트다운)
function startCountdown() {
  let timeLeft = 30;
  timerElement.innerText = timeLeft;

  countdown = setInterval(() => {
    timeLeft--;
    timerElement.innerText = timeLeft;

    if (timeLeft <= 0) {
      stopRecognition();
    }
  }, 1000);

  recognitionTimeout = setTimeout(() => {
    stopRecognition();
  }, 30000);
}

// face-api.js 표정 인식 시작
async function startFaceRecognition() {
  video.srcObject = await navigator.mediaDevices.getUserMedia({
    video: {},
  });

  const faceOptions = {
    withLandmarks: true,
    withExpressions: true,
    withDescriptors: true,
    minConfidence: 0.5,
  };

  faceapi = ml5.faceApi(video, faceOptions, () => {
    detectFaces(); // 얼굴 인식 시작
  });
}

function detectFaces() {
  faceapi.detect((error, result) => {
    if (error) {
      console.log(error);
      return;
    }

    detections = result;
    if (detections.length > 0) {
      const expressions = detections[0].expressions;

      // 각 표정을 퍼센트로 변환
      const expressionPercentages = {
        neutral: (expressions.neutral * 100).toFixed(2),
        happy: (expressions.happy * 100).toFixed(2),
        angry: (expressions.angry * 100).toFixed(2),
        sad: (expressions.sad * 100).toFixed(2),
        disgusted: (expressions.disgusted * 100).toFixed(2),
        surprised: (expressions.surprised * 100).toFixed(2),
        fearful: (expressions.fearful * 100).toFixed(2),
      };

      expressionResultElement.innerHTML = `
        Neutral: ${expressionPercentages.neutral}%<br>
        Happy: ${expressionPercentages.happy}%<br>
        Angry: ${expressionPercentages.angry}%<br>
        Sad: ${expressionPercentages.sad}%<br>
        Disgusted: ${expressionPercentages.disgusted}%<br>
        Surprised: ${expressionPercentages.surprised}%<br>
        Fearful: ${expressionPercentages.fearful}%
      `;

      expressionDataArray.push(expressions); // 30초 동안 표정 데이터를 배열에 저장
    }

    faceapi.detect(detectFaces); // 지속적인 감지
  });
}

// 종합 감정 분석 함수
function analyzeFinalEmotion() {
  const speechData = finalEmotionData.speech || "음성 감지 안 됨";

  // 30초 동안 감지된 표정 중에서 가장 높은 값 찾기
  const averagedExpressions = {
    neutral: 0,
    happy: 0,
    angry: 0,
    sad: 0,
    disgusted: 0,
    surprised: 0,
    fearful: 0,
  };

  expressionDataArray.forEach((expressions) => {
    averagedExpressions.neutral += expressions.neutral;
    averagedExpressions.happy += expressions.happy;
    averagedExpressions.angry += expressions.angry;
    averagedExpressions.sad += expressions.sad;
    averagedExpressions.disgusted += expressions.disgusted;
    averagedExpressions.surprised += expressions.surprised;
    averagedExpressions.fearful += expressions.fearful;
  });

  // 평균 계산
  const totalFrames = expressionDataArray.length;
  for (let key in averagedExpressions) {
    averagedExpressions[key] = (averagedExpressions[key] / totalFrames) * 100;
  }

  // 가장 높은 값을 가진 표정 찾기
  const finalExpression = Object.keys(averagedExpressions).reduce((a, b) =>
    averagedExpressions[a] > averagedExpressions[b] ? a : b
  );

  finalExpressionResultElement.innerText = `최종 표정 결과: ${finalExpression}, 퍼센트: ${averagedExpressions[
    finalExpression
  ].toFixed(2)}%`;
}

// GPT API에 요청을 보내는 함수
async function sendTextToGPT(text) {
  try {
    const response = await fetch("http://localhost:3000/gpt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }), // 음성 인식된 텍스트를 전송
    });

    const data = await response.json();
    gptResponseElement.innerText = data.response;
  } catch (error) {
    console.error("GPT 요청 실패:", error);
    gptResponseElement.innerText = "GPT 응답을 가져오는 데 실패했습니다.";
  }
}
