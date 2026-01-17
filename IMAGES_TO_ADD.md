# 🖼️ 이미지 추가 방법

## 업로드하신 2개의 이미지를 추가해주세요

### 📁 저장 위치

```bash
earnquest-real-version/public/images/
```

### 🎨 필요한 이미지

#### 1. 가족 성장 일러스트
- **원본 파일**: 첫 번째 업로드 이미지 (가족과 보상 차트)
- **저장 파일명**: `family-growth.png`
- **전체 경로**: `public/images/family-growth.png`

#### 2. 여정 인포그래픽
- **원본 파일**: 두 번째 업로드 이미지 (Tasks → Points → Rewards)
- **저장 파일명**: `journey-infographic.png`
- **전체 경로**: `public/images/journey-infographic.png`

---

## ⚡ 빠른 추가 방법

### 방법 1: 직접 저장
1. 채팅에서 업로드한 이미지를 우클릭 → "다른 이름으로 저장"
2. 각각 위의 파일명으로 저장
3. `public/images/` 폴더에 복사

### 방법 2: 터미널 사용
이미지 파일이 다운로드 폴더에 있다면:

```bash
# 프로젝트 디렉토리로 이동
cd /sessions/pensive-gracious-feynman/mnt/earnquest-real-version

# 이미지 복사 (경로는 실제 파일 위치에 맞게 수정)
cp ~/Downloads/family-illustration.png public/images/family-growth.png
cp ~/Downloads/journey-diagram.png public/images/journey-infographic.png
```

---

## ✅ 이미지 추가 후 확인

이미지를 추가한 후에는:

1. **개발 서버 실행**:
   ```bash
   npm run dev
   ```

2. **브라우저에서 확인**:
   - 영어 팜플렛: http://localhost:3001/pamphlet
   - 한글 팜플렛: http://localhost:3001/ko/pamphlet

3. Placeholder 대신 실제 이미지가 표시되어야 합니다!

---

## 🔧 문제 해결

### 이미지가 표시되지 않는 경우:

1. **파일명 확인**:
   ```bash
   ls -la public/images/
   ```

   다음 2개 파일이 있어야 합니다:
   - family-growth.png
   - journey-infographic.png

2. **파일 권한 확인**:
   ```bash
   chmod 644 public/images/*.png
   ```

3. **개발 서버 재시작**:
   ```bash
   # Ctrl+C로 서버 중지 후
   npm run dev
   ```

---

## 📝 현재 상태

✅ 팜플렛 페이지 레이아웃 완성
✅ 이미지 슬롯 준비 완료
✅ Placeholder UI 작동 중
⏳ **실제 이미지 파일 추가 필요** ← 여기!

이미지를 추가하시면 자동으로 placeholder가 실제 이미지로 교체됩니다! 🎉
