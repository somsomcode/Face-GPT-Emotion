let finalEmotionData = {};
let countdown;
let recognitionTimeout;

const recognizedTextElement = document.getElementById("recognizedText");
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
  startCountdown(); // 타이머 시작
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
