let faceapi;
let detections = [];
let expressionDataArray = []; // 30초 동안 감지된 표정 데이터를 저장할 배열

const video = document.getElementById("videoInput");
const expressionResultElement = document.getElementById("expressionResult");
const finalExpressionResultElement = document.getElementById(
  "finalExpressionResult"
);

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
