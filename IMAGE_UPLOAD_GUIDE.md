# 📸 Image Upload Guide for Pamphlet Pages

## 이미지를 추가하는 방법

팜플렛 페이지에 제공하신 2개의 이미지를 추가해야 합니다.

### 필요한 이미지

1. **가족 성장 일러스트** (Family Growth Illustration)
   - 파일명: `family-growth.png`
   - 설명: 부모님과 자녀들이 보상 차트와 함께 축하하는 모습
   - 위치: 히어로 섹션 (페이지 상단)

2. **여정 인포그래픽** (Journey Infographic)
   - 파일명: `journey-infographic.png`
   - 설명: "Complete Tasks → Earn Points → Redeem Rewards" 플로우
   - 위치: "How It Works" 섹션

### 📁 업로드 위치

```
earnquest-real-version/
└── public/
    └── images/
        ├── family-growth.png      ← 여기에 가족 일러스트 업로드
        └── journey-infographic.png ← 여기에 여정 인포그래픽 업로드
```

### 🔧 업로드 방법

#### 방법 1: 파일 직접 복사
```bash
# 이미지 파일이 있는 위치에서
cp family-illustration.png /sessions/pensive-gracious-feynman/mnt/earnquest-real-version/public/images/family-growth.png

cp journey-diagram.png /sessions/pensive-gracious-feynman/mnt/earnquest-real-version/public/images/journey-infographic.png
```

#### 방법 2: Claude에게 요청
채팅에서 이미지 파일을 업로드하고 다음과 같이 요청하세요:
```
"이 이미지를 /public/images/family-growth.png로 저장해줘"
```

### ✅ 이미지 추가 후 할 일

이미지를 추가한 후에는 코드의 주석을 해제해야 합니다:

**영어 팜플렛** (`/app/pamphlet/page.tsx`)
**한글 팜플렛** (`/app/ko/pamphlet/page.tsx`)

각 파일에서:
1. Placeholder div를 제거하거나 주석 처리
2. 주석 처리된 `<Image>` 컴포넌트의 주석을 해제

### 🎨 이미지 권장 사양

- **포맷**: PNG (투명 배경 선호) 또는 JPG
- **해상도**:
  - family-growth.png: 600x600px 이상
  - journey-infographic.png: 1200x600px 이상
- **최적화**: 웹 최적화 (파일 크기 1MB 이하 권장)

### 🚀 현재 상태

✅ 이미지 슬롯 생성 완료
✅ Placeholder UI 준비 완료 (이미지 없이도 작동)
⏳ 실제 이미지 파일 업로드 대기 중

이미지를 업로드하면 자동으로 placeholder가 실제 이미지로 대체됩니다!
