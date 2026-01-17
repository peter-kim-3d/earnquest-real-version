# 📄 EarnQuest 팜플렛 버전들

프로젝트에는 여러 버전의 팜플렛이 있습니다.

## 🎨 버전 목록

### 1. Next.js React 버전 (Claude 제작)
**경로**: `/app/pamphlet/page.tsx` 및 `/app/ko/pamphlet/page.tsx`

**특징**:
- Next.js 15 기반 React 컴포넌트
- 영어/한글 버전 별도 제공
- EarnQuest 원본 디자인 테마 (#2bb800 그린)
- TypeScript + Tailwind CSS
- 반응형 디자인
- 이미지 슬롯 준비됨

**접속 방법**:
```bash
npm run dev
```
- 영어: http://localhost:3001/pamphlet
- 한글: http://localhost:3001/ko/pamphlet

---

### 2. HTML 버전 (Gemini 제작) ✨ 새로 추가
**경로**: `/public/pamphlet-by-gemini.html`

**특징**:
- 순수 HTML/CSS/JavaScript
- 현대적이고 깔끔한 디자인
- 에메랄드 그린 색상 (#00C853)
- Phosphor Icons 사용
- 스크롤 애니메이션
- 완전히 독립적인 HTML 파일

**접속 방법**:
```bash
npm run dev
```
- http://localhost:3001/pamphlet-by-gemini.html

또는 브라우저에서 직접 파일 열기:
```
파일 탐색기 → public/pamphlet-by-gemini.html 더블클릭
```

---

## 🎯 어떤 버전을 사용할까?

### React 버전 (Claude)을 사용하세요:
- Next.js 프로젝트에 통합하려는 경우
- 원본 EarnQuest 브랜드 색상 유지
- 다국어(영어/한글) 지원 필요
- 이미지 업로드 예정

### HTML 버전 (Gemini)을 사용하세요:
- 독립적인 랜딩 페이지로 사용
- 바로 배포 가능한 파일 필요
- 현대적인 UI/UX 선호
- 서버 없이 바로 열 수 있는 파일 필요

---

## 🔄 버전 간 차이점

| 특징 | React 버전 (Claude) | HTML 버전 (Gemini) |
|------|---------------------|-------------------|
| 기술 스택 | Next.js + React | 순수 HTML |
| 색상 | #2bb800 (밝은 그린) | #00C853 (에메랄드) |
| 다국어 | ✅ 영어/한글 | ❌ 영어만 |
| 이미지 | 슬롯 준비됨 | 아이콘 기반 |
| 배포 | Next.js 필요 | 파일만 있으면 OK |
| 애니메이션 | 기본 호버 | 스크롤 fade-in |
| 아이콘 | Lucide React | Phosphor Icons |

---

## 📝 다음 단계

### React 버전 개선:
1. `/public/images/`에 이미지 추가
2. Placeholder를 실제 이미지로 교체

### HTML 버전 (Gemini) 사용:
1. `public/pamphlet-by-gemini.html` 파일을 원하는 곳에 복사
2. 브라우저에서 바로 열거나 웹 서버에 업로드

---

## 🚀 빠른 테스트

```bash
# 개발 서버 시작
cd /sessions/pensive-gracious-feynman/mnt/earnquest-real-version
npm run dev

# 브라우저에서 확인:
# - React 영어: http://localhost:3001/pamphlet
# - React 한글: http://localhost:3001/ko/pamphlet
# - HTML(Gemini): http://localhost:3001/pamphlet-by-gemini.html
```

두 버전 모두 제공되므로 용도에 맞게 선택하실 수 있습니다! 🎉
