/* eslint-disable @next/next/no-html-link-for-pages */
/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState } from 'react';
import { Users, Baby, Settings, Gift, Heart, CheckCircle, Home, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function ManualPageKo() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get current section index for navigation
  const currentIndex = sections.findIndex(s => s.id === activeSection);
  const prevSection = currentIndex > 0 ? sections[currentIndex - 1] : null;
  const nextSection = currentIndex < sections.length - 1 ? sections[currentIndex + 1] : null;
  const currentSection = sections[currentIndex];

  const navigateTo = (sectionId: string) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f6f8f6] to-white">
      {/* Header */}
      <header className="bg-white border-b border-[#2bb800]/20 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="EarnQuest" width={40} height={40} />
            <div>
              <h1 className="font-display text-2xl font-bold text-[#121811]">EarnQuest 매뉴얼</h1>
              <p className="text-sm text-[#688961]">가족을 위한 완전한 가이드</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="/ko/pamphlet" className="text-[#688961] hover:text-[#121811] font-medium flex items-center gap-2 transition-colors">
              <Home className="w-4 h-4" />
              홈
            </a>
            <Link href="/ko-KR/login" className="bg-[#2bb800] hover:bg-[#229900] px-5 py-2 rounded-full text-white font-semibold transition-all">
              로그인
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12 flex gap-8">
        {/* Mobile Contents Toggle */}
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full bg-white rounded-2xl shadow-lg border border-[#2bb800]/20 p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#2bb800] to-[#25a000] flex items-center justify-center">
                {currentSection && <currentSection.icon className="w-5 h-5 text-white" />}
              </div>
              <div className="text-left">
                <p className="text-xs text-[#688961]">현재 보는 중</p>
                <p className="font-semibold text-[#121811]">{currentSection?.title}</p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-[#688961] transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <nav className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-lg border border-[#2bb800]/10 p-4 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#688961]/10">
                <div className="w-2 h-2 rounded-full bg-[#2bb800]" />
                <h3 className="font-display font-bold text-[#121811] text-sm uppercase tracking-wide">목차</h3>
              </div>
              <ul className="space-y-1">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => navigateTo(section.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
                        activeSection === section.id
                          ? 'bg-gradient-to-r from-[#2bb800] to-[#25a000] text-white shadow-md'
                          : 'text-[#688961] hover:bg-[#f6f8f6]'
                      }`}
                    >
                      <section.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium text-sm">{section.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>

        {/* Sidebar Navigation - Desktop */}
        <aside className="w-64 flex-shrink-0 sticky top-24 h-fit hidden md:block">
          <nav className="bg-gradient-to-br from-white to-[#f6f8f6] rounded-2xl p-6 shadow-card border border-[#2bb800]/10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#2bb800]" />
              <h3 className="font-display font-bold text-[#121811] text-sm uppercase tracking-wide">목차</h3>
            </div>
            <ul className="space-y-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => navigateTo(section.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
                      activeSection === section.id
                        ? 'bg-gradient-to-r from-[#2bb800] to-[#25a000] text-white shadow-md'
                        : 'text-[#688961] hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <section.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm">{section.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 pb-24 md:pb-0">
          <div className="bg-white rounded-2xl p-6 md:p-12 shadow-card">
            {activeSection === 'getting-started' && <GettingStarted />}
            {activeSection === 'parent-guide' && <ParentGuide />}
            {activeSection === 'child-guide' && <ChildGuide />}
            {activeSection === 'tasks' && <TasksGuide />}
            {activeSection === 'rewards' && <RewardsGuide />}
            {activeSection === 'kindness' && <KindnessGuide />}
            {activeSection === 'settings' && <SettingsGuide />}

            {/* Bottom Navigation */}
            <div className="mt-12 pt-8 border-t border-[#688961]/20">
              <div className="flex items-center justify-between gap-4">
                {/* Previous */}
                {prevSection ? (
                  <button
                    onClick={() => navigateTo(prevSection.id)}
                    className="flex-1 flex items-center gap-3 p-4 rounded-xl border border-[#688961]/20 hover:border-[#2bb800] hover:bg-[#2bb800]/5 transition-all group text-left"
                  >
                    <ChevronLeft className="w-5 h-5 text-[#688961] group-hover:text-[#2bb800] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-[#688961]">이전</p>
                      <p className="font-semibold text-[#121811] truncate">{prevSection.title}</p>
                    </div>
                  </button>
                ) : (
                  <div className="flex-1" />
                )}

                {/* Current Page Indicator */}
                <div className="hidden md:flex items-center gap-1">
                  {sections.map((section, index) => (
                    <button
                      key={section.id}
                      onClick={() => navigateTo(section.id)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentIndex
                          ? 'w-6 bg-[#2bb800]'
                          : 'bg-[#688961]/30 hover:bg-[#688961]/50'
                      }`}
                      title={section.title}
                    />
                  ))}
                </div>

                {/* Next */}
                {nextSection ? (
                  <button
                    onClick={() => navigateTo(nextSection.id)}
                    className="flex-1 flex items-center justify-end gap-3 p-4 rounded-xl border border-[#688961]/20 hover:border-[#2bb800] hover:bg-[#2bb800]/5 transition-all group text-right"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-[#688961]">다음</p>
                      <p className="font-semibold text-[#121811] truncate">{nextSection.title}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#688961] group-hover:text-[#2bb800] flex-shrink-0" />
                  </button>
                ) : (
                  <div className="flex-1" />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Section Components
function GettingStarted() {
  return (
    <div className="prose prose-lg max-w-none">
      <h1 className="font-display text-5xl font-bold text-[#121811] mb-6">EarnQuest 시작하기</h1>
      <p className="text-xl text-[#688961] mb-8">EarnQuest에 오신 것을 환영합니다! 몇 분 만에 가족 설정을 완료해보세요.</p>

      <div className="bg-[#2bb800]/10 rounded-xl p-6 mb-8">
        <h3 className="font-display text-xl font-bold text-[#121811] mb-2">필요한 것</h3>
        <ul className="space-y-2 text-[#688961]">
          <li className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[#2bb800]" />
            <span>5분의 시간</span>
          </li>
          <li className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[#2bb800]" />
            <span>Google 또는 이메일 계정</span>
          </li>
          <li className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[#2bb800]" />
            <span>자녀의 이름과 생년월일</span>
          </li>
        </ul>
      </div>

      <Section title="부모 계정 만들기">
        <p className="text-[#688961] mb-4">세 가지 방법으로 부모 계정을 만들 수 있습니다:</p>
        <ul className="space-y-2 text-[#688961]">
          <li className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-[#2bb800] flex-shrink-0 mt-1" />
            <div><strong>Google OAuth</strong> - Google 계정으로 원클릭 가입</div>
          </li>
          <li className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-[#2bb800] flex-shrink-0 mt-1" />
            <div><strong>이메일 + 비밀번호</strong> - 이메일 확인이 필요한 일반 가입</div>
          </li>
        </ul>
      </Section>

      <Section title="4단계 온보딩">
        <StepItem
          number={1}
          title="자녀 추가"
          description="자녀의 이름과 생년월일을 입력하세요. 시스템이 자동으로 연령 그룹을 배정합니다:"
          items={[
            "🐣 미니 어너 (5-7세) - 간단한 태스크, 많은 격려",
            "🚀 프로 어너 (8-11세) - 균형 잡힌 도전과 책임",
            "🎓 틴 어너 (12-14세) - 더 많은 자율성과 복잡한 태스크"
          ]}
        />

        <StepItem
          number={2}
          title="스타일 선택"
          description="태스크 프리셋과 선택적 추가 모듈을 선택하세요:"
          items={[
            "🌱 스타터 (5개 태스크, ~70 일일 XP) - 점진적 습관 형성",
            "⭐ 균형 (8개 태스크, ~125 일일 XP) - 대부분의 가족에게 추천",
            "📖 학습 중심 (6개 태스크, ~110 일일 XP) - 학업 강조"
          ]}
        />

        <div className="bg-[#f6f8f6] rounded-xl p-4 ml-14 mb-6">
          <p className="text-sm text-[#688961] font-medium mb-2">선택적 추가 모듈:</p>
          <ul className="text-sm text-[#688961] space-y-1">
            <li>🧼 <strong>위생 루틴</strong> - 양치, 손 씻기, 샤워</li>
            <li>💪 <strong>피트니스</strong> - 운동과 야외 놀이</li>
            <li>🎵 <strong>취미</strong> - 악기 연습, 미술/공예</li>
          </ul>
        </div>

        <StepItem
          number={3}
          title="가족 가치관"
          description="일일 알림으로 표시될 가족 가치관을 토글하세요 (선택 사항). 예: 감사, 인사, 정직, 존중, 깨끗한 공간."
        />

        <StepItem
          number={4}
          title="완료 & 시작"
          description="설정 요약을 검토하고 EarnQuest를 시작하세요! 나중에 대시보드에서 언제든지 태스크와 보상을 조정할 수 있습니다."
        />
      </Section>

      <Section title="자녀 로그인 설정">
        <p className="text-[#688961] mb-4">온보딩 후 자녀 접속을 설정하세요:</p>
        <ol className="space-y-3 text-[#688961]">
          <li>1. <strong>설정 → 기기 연결</strong>로 이동하여 6자리 가족 코드를 찾으세요</li>
          <li>2. (선택) <strong>PIN 보호</strong>를 활성화하고 각 자녀의 4자리 PIN을 설정하세요</li>
          <li>3. 자녀의 기기에서 자녀 로그인 페이지로 이동하여 가족 코드를 입력하세요</li>
          <li>4. 자녀 프로필을 선택하세요 (필요시 PIN 입력)</li>
        </ol>
      </Section>

      <div className="bg-[#0ea5e9]/10 rounded-xl p-6 mt-10">
        <h3 className="font-display text-xl font-bold text-[#121811] mb-2 flex items-center gap-2">
          <Heart className="w-6 h-6 text-[#0ea5e9]" />
          프로 팁
        </h3>
        <p className="text-[#688961]">
          첫 주에는 3-5개의 태스크만으로 시작하세요. 자녀가 루틴에 익숙해지면 점차 더 많은 태스크를 추가하고 복잡도를 높일 수 있습니다.
        </p>
      </div>
    </div>
  );
}

function ParentGuide() {
  return (
    <div className="prose prose-lg max-w-none">
      <h1 className="font-display text-5xl font-bold text-[#121811] mb-6">부모 가이드</h1>
      <p className="text-xl text-[#688961] mb-8">가족의 EarnQuest 경험을 관리하는 데 필요한 모든 것.</p>

      <Section title="대시보드 개요">
        <p className="text-[#688961] mb-4">대시보드에서 모든 것을 한눈에 확인할 수 있습니다:</p>
        <div className="grid md:grid-cols-3 gap-4 my-6">
          <div className="bg-blue-50 rounded-xl p-4">
            <h4 className="font-bold text-[#121811] mb-2">⚡ 활성 태스크</h4>
            <p className="text-sm text-[#688961]">현재 가족에게 활성화된 총 태스크 수</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4">
            <h4 className="font-bold text-[#121811] mb-2">🔔 대기 중인 승인</h4>
            <p className="text-sm text-[#688961]">검토를 기다리는 태스크</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4">
            <h4 className="font-bold text-[#121811] mb-2">📈 주간 XP</h4>
            <p className="text-sm text-[#688961]">이번 주 가족이 획득한 총 포인트</p>
          </div>
        </div>
        <p className="text-[#688961]"><strong>액션 센터</strong>에서 모든 대기 중인 태스크 완료를 볼 수 있습니다. 개별 승인 또는 일괄 승인으로 여러 태스크를 한 번에 처리할 수 있습니다.</p>
      </Section>

      <Section title="태스크 관리하기">
        <SubSection title="태스크 만들기">
          <ol className="space-y-3 text-[#688961]">
            <li>1. <strong>태스크</strong> 페이지로 이동하여 "새 태스크" 클릭</li>
            <li>2. 태스크 세부정보 입력:
              <ul className="ml-6 mt-2 space-y-1">
                <li>• <strong>태스크 이름</strong>과 선택적 설명</li>
                <li>• <strong>아이콘 또는 이미지</strong> - 라이브러리에서 선택 또는 업로드</li>
                <li>• <strong>카테고리</strong> - 📚 학습, 🏡 라이프 스킬, 또는 ❤️ 건강</li>
                <li>• <strong>시간대</strong> - ☀️ 아침, 🏠 방과후, 🌙 저녁, 또는 📚 언제든지</li>
                <li>• <strong>포인트</strong> - 5~500 XP (슬라이더 사용)</li>
              </ul>
            </li>
            <li>3. 빈도 설정: 매일, 매주 (특정 요일), 매월 또는 일회성</li>
            <li>4. 승인 방법 선택 및 자녀에게 할당</li>
          </ol>
        </SubSection>

        <SubSection title="승인 방법">
          <ul className="space-y-3 text-[#688961]">
            <li className="flex gap-3">
              <span className="text-xl">👤</span>
              <div><strong>부모</strong> - 각 완료를 수동으로 검토하고 승인합니다</div>
            </li>
            <li className="flex gap-3">
              <span className="text-xl">⏱️</span>
              <div><strong>타이머</strong> - 자녀가 타이머를 실행 (1-180분), 완료 시 자동 승인. 포인트는 분당 1.5 XP로 자동 계산됩니다.</div>
            </li>
            <li className="flex gap-3">
              <span className="text-xl">✓</span>
              <div><strong>체크리스트</strong> - 자녀가 하위 단계를 체크한 후 승인을 위해 제출합니다</div>
            </li>
            <li className="flex gap-3">
              <span className="text-xl">⚡</span>
              <div><strong>자동</strong> - 24시간 후 자동 승인 (신뢰할 수 있는 태스크에만 사용)</div>
            </li>
          </ul>
        </SubSection>
      </Section>

      <Section title="액션 센터">
        <p className="text-[#688961] mb-4">효율적으로 태스크 승인을 처리하세요:</p>
        <ul className="space-y-2 text-[#688961]">
          <li>• <strong>완료 확인</strong> - 태스크를 승인하고 XP를 부여합니다</li>
          <li>• <strong>수정 요청</strong> - 피드백을 보내고 자녀에게 다시 하도록 요청합니다</li>
          <li>• <strong>일괄 승인</strong> - 여러 태스크를 선택하고 한 번에 승인합니다</li>
        </ul>
      </Section>

      <Section title="보상 관리">
        <SubSection title="보상 카테고리">
          <div className="grid md:grid-cols-2 gap-3 my-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <strong>📺 스크린 타임</strong>
              <p className="text-sm text-[#688961]">내장 타이머가 있는 디지털 기기 시간</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <strong>🔓 파워업</strong>
              <p className="text-sm text-[#688961]">즉시 사용 가능 (예: 집안일 건너뛰기)</p>
            </div>
            <div className="bg-pink-50 rounded-lg p-3">
              <strong>🎉 펀 스터프</strong>
              <p className="text-sm text-[#688961]">수동으로 이행하는 경험</p>
            </div>
            <div className="bg-teal-50 rounded-lg p-3">
              <strong>💰 저축</strong>
              <p className="text-sm text-[#688961]">즉시 포인트 차감 (가상 저축)</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <strong>🎁 기프트 카드</strong>
              <p className="text-sm text-[#688961]">나중에 제공하는 실물 아이템</p>
            </div>
          </div>
        </SubSection>
      </Section>

      <div className="bg-[#0ea5e9]/10 rounded-xl p-6 mt-8">
        <h3 className="font-display text-xl font-bold text-[#121811] mb-2">모범 사례</h3>
        <ul className="space-y-2 text-[#688961]">
          <li>✓ 태스크를 연령에 맞고 달성 가능하게 유지하세요</li>
          <li>✓ 다양한 태스크 카테고리와 시간대의 균형을 맞추세요</li>
          <li>✓ 24시간 내에 태스크 승인에 응답하세요</li>
          <li>✓ 매월 포인트 값을 검토하고 조정하세요</li>
          <li>✓ "자녀에게 선물" 기능으로 자발적인 좋은 행동에 보상하세요</li>
        </ul>
      </div>
    </div>
  );
}

function ChildGuide() {
  return (
    <div className="prose prose-lg max-w-none">
      <h1 className="font-display text-5xl font-bold text-[#121811] mb-6">어린이 가이드</h1>
      <p className="text-xl text-[#688961] mb-8">퀘스트를 완료하고 XP를 획득하며 멋진 보상을 받는 방법을 배워보세요!</p>

      <Section title="나만의 퀘스트 대시보드">
        <p className="text-[#688961] mb-4">로그인하면 개인 대시보드를 볼 수 있어요:</p>
        <ul className="space-y-3 text-[#688961]">
          <li className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2bb800]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">⭐</span>
            </div>
            <div><strong>내 XP 잔액</strong> - 획득해서 사용할 수 있는 퀘스트 포인트</div>
          </li>
          <li className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2bb800]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🔥</span>
            </div>
            <div><strong>연속 기록</strong> - 태스크를 완료한 연속 일수</div>
          </li>
          <li className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2bb800]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🎯</span>
            </div>
            <div><strong>주간 목표</strong> - 주간 XP 목표에 얼마나 가까운지 보여주는 진행률 바</div>
          </li>
        </ul>

        <SubSection title="태스크 탭">
          <div className="grid md:grid-cols-3 gap-3 my-4">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <strong>📋 할 일</strong>
              <p className="text-sm text-[#688961]">완료할 준비가 된 태스크</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <strong>⏳ 부모님 확인 중</strong>
              <p className="text-sm text-[#688961]">승인 대기 중</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <strong>✅ 완료됨</strong>
              <p className="text-sm text-[#688961]">오늘 완료!</p>
            </div>
          </div>
        </SubSection>

        <SubSection title="태스크 그룹">
          <p className="text-[#688961]">태스크는 해야 할 시간별로 정리되어 있어요:</p>
          <ul className="text-[#688961] mt-2 space-y-1">
            <li>☀️ <strong>아침</strong> - 학교 가기 전 태스크</li>
            <li>🏠 <strong>방과후</strong> - 집에 왔을 때</li>
            <li>🌙 <strong>저녁</strong> - 자기 전</li>
            <li>📚 <strong>언제든지</strong> - 원할 때 하면 돼요</li>
          </ul>
        </SubSection>
      </Section>

      <Section title="태스크 완료하기">
        <p className="text-[#688961] mb-4">태스크를 완료하고 XP를 모으는 방법:</p>

        <StepItem number={1} title="태스크 선택" description="'할 일' 목록에서 태스크를 선택하세요" />
        <StepItem number={2} title="태스크 수행" description="활동을 완료하세요! 최선을 다해보세요." />
        <StepItem number={3} title="완료 표시" description="태스크 카드를 탭하세요. 타이머 태스크는 타이머가 자동으로 실행되고, 체크리스트 태스크는 각 단계를 체크하세요." />
        <StepItem number={4} title="XP 받기!" description="자동 승인이면 바로 XP를 받아요. 아니면 부모님이 승인할 때까지 기다리세요." />

        <div className="bg-orange-50 rounded-xl p-4 mt-4">
          <p className="text-sm text-[#688961]"><strong>⚠️ 주의 필요:</strong> 부모님이 수정을 요청하시면 태스크 목록 맨 위에 피드백과 함께 표시돼요.</p>
        </div>
      </Section>

      <Section title="보상 스토어">
        <p className="text-[#688961] mb-4">열심히 번 XP로 보상을 구매하세요!</p>
        <ul className="space-y-2 text-[#688961]">
          <li>• <strong>월렛 카드</strong> - 현재 XP 잔액 표시</li>
          <li>• <strong>스크린 타임 예산</strong> - 오늘/이번 주에 남은 스크린 타임 확인</li>
          <li>• <strong>보상 카드</strong> - 보상을 둘러보고 구매하세요 (초록색 = 구매 가능, 회색 = XP 더 필요)</li>
        </ul>
        <p className="text-[#688961] mt-4">보상을 구매하면 <strong>티켓</strong>이 되어 "내 티켓" 페이지로 이동해요.</p>
      </Section>

      <Section title="내 티켓">
        <p className="text-[#688961] mb-4">티켓은 구매한 보상이에요:</p>
        <div className="grid md:grid-cols-2 gap-3 my-4">
          <div className="bg-green-50 rounded-lg p-3">
            <strong>✨ 활성</strong>
            <p className="text-sm text-[#688961]">사용할 준비 완료</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3">
            <strong>⏳ 대기 중</strong>
            <p className="text-sm text-[#688961]">부모님 승인 대기</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <strong>▶️ 플레이 중</strong>
            <p className="text-sm text-[#688961]">스크린 타임 진행 중</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <strong>✅ 사용됨</strong>
            <p className="text-sm text-[#688961]">이미 사용함!</p>
          </div>
        </div>
        <p className="text-[#688961]">스크린 타임 보상은 "지금 사용"을 탭하면 풀스크린 타이머가 시작돼요. 시간이 끝나면 소리가 나요!</p>
      </Section>

      <div className="bg-[#f49d25]/10 rounded-xl p-6 mt-8">
        <h3 className="font-display text-xl font-bold text-[#121811] mb-3">🌟 친절 뱃지</h3>
        <p className="text-[#688961] mb-3">
          <strong>뱃지</strong> 페이지에서 가족에게 받은 감사 카드를 확인하세요! 카드를 모아서 뱃지를 획득하세요:
        </p>
        <ul className="text-[#688961] space-y-1">
          <li>🥉 <strong>브론즈 뱃지</strong> - 5개 카드</li>
          <li>🥈 <strong>실버 뱃지</strong> - 10개 카드</li>
          <li>🥇 <strong>골드 뱃지</strong> - 20개 카드</li>
        </ul>
      </div>

      <div className="bg-[#2bb800]/10 rounded-xl p-6 mt-6">
        <h3 className="font-display text-xl font-bold text-[#121811] mb-3">성공을 위한 팁 💪</h3>
        <ul className="space-y-2 text-[#688961]">
          <li>✓ 매일 아침 태스크를 확인하세요</li>
          <li>✓ 학교 가기 전에 아침 태스크를 해요</li>
          <li>✓ 타이머 태스크는 끝까지 완료하세요 - 건너뛰지 마세요!</li>
          <li>✓ 더 큰 보상을 위해 XP를 저축하세요 (목표를 확인하세요!)</li>
          <li>✓ 태스크가 너무 어려우면 도움을 요청하세요</li>
        </ul>
      </div>
    </div>
  );
}

function TasksGuide() {
  return (
    <div className="prose prose-lg max-w-none">
      <h1 className="font-display text-5xl font-bold text-[#121811] mb-6">태스크 시스템 가이드</h1>
      <p className="text-xl text-[#688961] mb-8">EarnQuest에서 태스크가 작동하는 방식에 대한 심층 가이드.</p>

      <Section title="태스크 카테고리">
        <p className="text-[#688961] mb-4">모든 태스크는 세 가지 주요 카테고리 중 하나에 속합니다:</p>
        <div className="grid md:grid-cols-3 gap-6 my-6">
          <div className="bg-[#2bb800]/10 rounded-xl p-6">
            <h4 className="font-display text-xl font-bold text-[#121811] mb-3">📚 학습</h4>
            <p className="text-[#688961] text-sm">숙제, 독서, 교육 앱, 글쓰기 연습, 플래너 확인</p>
          </div>
          <div className="bg-[#0ea5e9]/10 rounded-xl p-6">
            <h4 className="font-display text-xl font-bold text-[#121811] mb-3">🏡 라이프 스킬</h4>
            <p className="text-[#688961] text-sm">침대 정리, 가방 정리, 내일 준비, 책상 정리, 정돈</p>
          </div>
          <div className="bg-[#f49d25]/10 rounded-xl p-6">
            <h4 className="font-display text-xl font-bold text-[#121811] mb-3">❤️ 건강</h4>
            <p className="text-[#688961] text-sm">양치질, 샤워, 운동, 야외 놀이, 위생 루틴</p>
          </div>
        </div>
      </Section>

      <Section title="시간대">
        <p className="text-[#688961] mb-4">태스크는 해야 할 시간별로 정리됩니다:</p>
        <div className="grid md:grid-cols-4 gap-4 my-6">
          <div className="bg-yellow-50 rounded-xl p-4 text-center">
            <span className="text-2xl">☀️</span>
            <h4 className="font-bold text-[#121811] mt-2">아침</h4>
            <p className="text-xs text-[#688961]">학교 가기 전</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <span className="text-2xl">🏠</span>
            <h4 className="font-bold text-[#121811] mt-2">방과후</h4>
            <p className="text-xs text-[#688961]">집에 왔을 때</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <span className="text-2xl">🌙</span>
            <h4 className="font-bold text-[#121811] mt-2">저녁</h4>
            <p className="text-xs text-[#688961]">자기 전</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <span className="text-2xl">📚</span>
            <h4 className="font-bold text-[#121811] mt-2">언제든지</h4>
            <p className="text-xs text-[#688961]">유연하게</p>
          </div>
        </div>
      </Section>

      <Section title="XP 값 가이드">
        <p className="text-[#688961] mb-4">태스크 난이도와 시간에 따른 권장 XP 값:</p>
        <ul className="space-y-3 text-[#688961]">
          <li><strong>10-20 XP</strong> - 빠른 태스크 (5-10분): 도시락통 싱크대에 놓기, 손 씻기</li>
          <li><strong>20-30 XP</strong> - 중간 태스크 (10-20분): 침대 정리, 양치질, 책상 정리</li>
          <li><strong>30-50 XP</strong> - 긴 태스크 (20-40분): 가방 정리, 내일 준비</li>
          <li><strong>50-60 XP</strong> - 주요 태스크 (40분 이상): 숙제, 독서 시간, 악기 연습</li>
        </ul>
        <div className="bg-gray-50 rounded-lg p-4 mt-4">
          <p className="text-sm text-[#688961]"><strong>타이머 태스크:</strong> 포인트는 분당 ~1.5 XP로 자동 계산됩니다</p>
        </div>
      </Section>

      <Section title="빈도 옵션">
        <p className="text-[#688961] mb-4">태스크는 자동으로 반복될 수 있습니다:</p>
        <ul className="space-y-2 text-[#688961]">
          <li>• <strong>☀️ 매일</strong> - 태스크가 매일 나타납니다</li>
          <li>• <strong>📅 매주</strong> - 특정 요일 선택 (월, 수, 금 등)</li>
          <li>• <strong>📆 매월</strong> - 월 1회 (언제든, 특정 날짜, 첫날/마지막 날)</li>
          <li>• <strong>⚡ 일회성</strong> - 한 번만 발생, 그 후 완료</li>
        </ul>
      </Section>

      <Section title="신뢰 레벨">
        <p className="text-[#688961] mb-4">자녀가 책임감을 보여줄수록 신뢰 레벨이 올라갑니다:</p>
        <div className="space-y-4">
          <div className="border-l-4 border-gray-300 pl-4">
            <strong className="text-[#121811]">레벨 1 (시작)</strong>
            <p className="text-[#688961] text-sm mt-1">모든 태스크가 부모 승인 필요. 새 자녀의 기본값.</p>
          </div>
          <div className="border-l-4 border-[#0ea5e9] pl-4">
            <strong className="text-[#121811]">레벨 2 (신뢰 구축 중)</strong>
            <p className="text-[#688961] text-sm mt-1">간단한 루틴 태스크가 자동 승인될 수 있습니다.</p>
          </div>
          <div className="border-l-4 border-[#2bb800] pl-4">
            <strong className="text-[#121811]">레벨 3 (신뢰됨)</strong>
            <p className="text-[#688961] text-sm mt-1">대부분의 태스크가 자동 승인. 자녀가 일관된 책임감을 입증했습니다.</p>
          </div>
        </div>
      </Section>

      <Section title="태스크 템플릿">
        <p className="text-[#688961] mb-4">EarnQuest에는 시간별로 정리된 18개의 사전 제작 태스크 템플릿이 포함되어 있습니다:</p>
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="grid md:grid-cols-2 gap-4 text-sm text-[#688961]">
            <div>
              <strong className="text-[#121811]">아침:</strong> 제시간에 일어나기, 침대 정리, 양치질
            </div>
            <div>
              <strong className="text-[#121811]">방과후:</strong> 가방 정리, 도시락통 싱크대에 놓기, 플래너 확인
            </div>
            <div>
              <strong className="text-[#121811]">저녁:</strong> 내일 준비, 양치질, 샤워
            </div>
            <div>
              <strong className="text-[#121811]">언제든지:</strong> 숙제, 독서, 운동, 악기 연습
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

function RewardsGuide() {
  return (
    <div className="prose prose-lg max-w-none">
      <h1 className="font-display text-5xl font-bold text-[#121811] mb-6">보상 스토어 가이드</h1>
      <p className="text-xl text-[#688961] mb-8">아이들이 좋아할 동기부여되는 보상을 만드세요.</p>

      <Section title="보상 카테고리">
        <p className="text-[#688961] mb-4">다양한 이행 방식을 가진 6가지 카테고리:</p>
        <div className="space-y-6">
          <div className="border-l-4 border-blue-500 pl-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">📺</span>
              <h3 className="font-display text-2xl font-bold text-[#121811]">스크린 타임</h3>
            </div>
            <p className="text-[#688961] mb-3">내장 타이머가 있는 디지털 기기 시간. 자녀가 사용 요청 → 부모 승인 → 타이머 자동 시작.</p>
            <ul className="space-y-1 text-[#688961] text-sm">
              <li>• 30분 아이패드 시간 - 100 XP</li>
              <li>• 1시간 비디오 게임 시간 - 150 XP</li>
              <li>• 영화 보기 - 200 XP</li>
            </ul>
          </div>

          <div className="border-l-4 border-orange-500 pl-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🔓</span>
              <h3 className="font-display text-2xl font-bold text-[#121811]">파워업</h3>
            </div>
            <p className="text-[#688961] mb-3">즉시 사용 가능한 보상. 포인트가 즉시 차감되고, 승인 필요 없음.</p>
            <ul className="space-y-1 text-[#688961] text-sm">
              <li>• 오늘 집안일 건너뛰기 - 100 XP</li>
              <li>• 30분 늦게 자기 - 120 XP</li>
            </ul>
          </div>

          <div className="border-l-4 border-pink-500 pl-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🎉</span>
              <h3 className="font-display text-2xl font-bold text-[#121811]">펀 스터프</h3>
            </div>
            <p className="text-[#688961] mb-3">수동으로 이행하는 경험. 자녀 구매 → 완료 시 부모가 '제공됨' 표시.</p>
            <ul className="space-y-1 text-[#688961] text-sm">
              <li>• 가족 영화 선택 - 150 XP</li>
              <li>• 친구와 슬립오버 - 300 XP</li>
            </ul>
          </div>

          <div className="border-l-4 border-teal-500 pl-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">💰</span>
              <h3 className="font-display text-2xl font-bold text-[#121811]">저축</h3>
            </div>
            <p className="text-[#688961] mb-3">가상 저축 카테고리. 포인트가 즉시 차감됨. 지연된 만족을 가르치는 데 좋음.</p>
          </div>

          <div className="border-l-4 border-purple-500 pl-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🎁</span>
              <h3 className="font-display text-2xl font-bold text-[#121811]">기프트 카드</h3>
            </div>
            <p className="text-[#688961] mb-3">나중에 제공하는 실물 아이템. 자녀 구매 → 준비되면 아이템 제공.</p>
          </div>
        </div>
      </Section>

      <Section title="스크린 타임 예산">
        <p className="text-[#688961] mb-4">스크린 타임 예산 시스템으로 기기 시간을 관리하세요:</p>
        <ul className="space-y-2 text-[#688961]">
          <li>• <strong>일일 한도</strong> - 하루 최대 스크린 타임</li>
          <li>• <strong>주간 한도</strong> - 주 동안의 총 스크린 타임</li>
          <li>• <strong>타이머</strong> - 스크린 타임 보상 사용 시 풀스크린 카운트다운</li>
          <li>• <strong>보너스 시간</strong> - 업적으로 획득한 추가 시간 (초록색으로 표시)</li>
        </ul>
      </Section>

      <Section title="목표 시스템">
        <p className="text-[#688961] mb-4">목표를 사용하여 아이들이 더 큰 보상을 위해 저축하도록 도와주세요:</p>
        <div className="grid md:grid-cols-4 gap-3 my-4">
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <strong>소형</strong>
            <p className="text-sm text-[#688961]">200 XP</p>
            <p className="text-xs text-[#688961]">~1주</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <strong>중형</strong>
            <p className="text-sm text-[#688961]">500 XP</p>
            <p className="text-xs text-[#688961]">~2-3주</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <strong>대형</strong>
            <p className="text-sm text-[#688961]">1000 XP</p>
            <p className="text-xs text-[#688961]">~1개월</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <strong>XL</strong>
            <p className="text-sm text-[#688961]">2000 XP</p>
            <p className="text-xs text-[#688961]">대형 목표</p>
          </div>
        </div>
        <SubSection title="마일스톤 보너스">
          <p className="text-[#688961]">마일스톤 보너스를 활성화하여 목표의 25%, 50%, 75%에서 진행 상황에 보상하세요. 장기 저축 중에 아이들의 동기를 유지해줍니다!</p>
        </SubSection>
      </Section>

      <div className="bg-[#0ea5e9]/10 rounded-xl p-6 mt-8">
        <h3 className="font-display text-xl font-bold text-[#121811] mb-3">💡 모범 사례</h3>
        <ul className="space-y-2 text-[#688961]">
          <li>✓ 빠른 달성과 큰 목표를 혼합해서 제공하세요</li>
          <li>✓ 비물질적 보상(경험, 특권)을 포함하세요</li>
          <li>✓ 과다 사용을 방지하기 위해 주간 한도를 사용하세요</li>
          <li>✓ 아이들이 원하는 보상을 제안하게 하세요</li>
          <li>✓ "자녀에게 선물" 기능으로 자발적인 좋은 행동에 보상하세요</li>
        </ul>
      </div>
    </div>
  );
}

function KindnessGuide() {
  return (
    <div className="prose prose-lg max-w-none">
      <h1 className="font-display text-5xl font-bold text-[#121811] mb-6">친절 시스템</h1>
      <p className="text-xl text-[#688961] mb-8">친사회적 행동과 공감을 인정하고 축하합니다.</p>

      <div className="bg-gradient-to-br from-[#f49d25]/20 to-[#0ea5e9]/20 rounded-2xl p-8 mb-8">
        <h3 className="font-display text-2xl font-bold text-[#121811] mb-4">친절 시스템이란?</h3>
        <p className="text-[#688961]">
          친절 시스템은 일반 태스크와 별개입니다. 자녀가 공감을 보이거나, 다른 사람을 돕거나, 부탁하지 않았는데 친절한 일을 할 때 이를 알아차리고 축하하기 위해 설계되었습니다. 감사 카드를 보내 이 순간들을 인정하세요!
        </p>
      </div>

      <Section title="감사 카드 보내기">
        <p className="text-[#688961] mb-4"><strong>친절 → 친절 보내기</strong>로 이동하여 카드를 보내세요:</p>
        <StepItem number={1} title="수신자 선택" description="감사하고 싶은 자녀를 선택하세요" />
        <StepItem number={2} title="테마 선택" description="4가지 아름다운 카드 테마 중 선택하세요:" />
        <div className="grid grid-cols-4 gap-3 ml-14 mb-6">
          <div className="bg-purple-100 rounded-lg p-3 text-center">
            <span className="text-xl">✨</span>
            <p className="text-xs font-medium">코스믹</p>
          </div>
          <div className="bg-green-100 rounded-lg p-3 text-center">
            <span className="text-xl">🌿</span>
            <p className="text-xs font-medium">네이처</p>
          </div>
          <div className="bg-orange-100 rounded-lg p-3 text-center">
            <span className="text-xl">⚡</span>
            <p className="text-xs font-medium">슈퍼 히어로</p>
          </div>
          <div className="bg-pink-100 rounded-lg p-3 text-center">
            <span className="text-xl">❤️</span>
            <p className="text-xs font-medium">러브</p>
          </div>
        </div>
        <StepItem number={3} title="메시지 작성" description="개인적인 메시지를 작성하세요 (최대 140자). '도움 주기' 또는 '내 하루를 더 좋게 만들어줌' 같은 빠른 프롬프트를 사용하세요." />
      </Section>

      <Section title="친절 뱃지">
        <p className="text-[#688961] mb-4">아이들은 받은 감사 카드에 따라 뱃지를 획득합니다:</p>
        <div className="grid md:grid-cols-3 gap-4 my-6">
          <div className="bg-amber-50 rounded-xl p-6 text-center border-2 border-amber-200">
            <span className="text-4xl">🥉</span>
            <h4 className="font-bold text-[#121811] mt-2">브론즈 뱃지</h4>
            <p className="text-sm text-[#688961]">감사 카드 5개</p>
          </div>
          <div className="bg-gray-100 rounded-xl p-6 text-center border-2 border-gray-300">
            <span className="text-4xl">🥈</span>
            <h4 className="font-bold text-[#121811] mt-2">실버 뱃지</h4>
            <p className="text-sm text-[#688961]">감사 카드 10개</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-6 text-center border-2 border-yellow-300">
            <span className="text-4xl">🥇</span>
            <h4 className="font-bold text-[#121811] mt-2">골드 뱃지</h4>
            <p className="text-sm text-[#688961]">감사 카드 20개</p>
          </div>
        </div>
        <p className="text-[#688961]">아이들은 대시보드의 <strong>뱃지</strong> 페이지에서 뱃지 진행 상황과 최근 카드를 볼 수 있습니다.</p>
      </Section>

      <Section title="친절 행동의 예">
        <div className="grid md:grid-cols-2 gap-4 my-6">
          <div className="bg-white rounded-xl p-4 border border-[#2bb800]/20">
            <h4 className="font-display font-bold text-[#121811] mb-3">가족 돕기</h4>
            <ul className="space-y-2 text-[#688961] text-sm">
              <li className="flex items-start gap-2"><Heart className="w-4 h-4 text-[#f49d25] flex-shrink-0 mt-0.5" /><span>형제자매 숙제 도와주기</span></li>
              <li className="flex items-start gap-2"><Heart className="w-4 h-4 text-[#f49d25] flex-shrink-0 mt-0.5" /><span>부모님을 위해 아침 만들기</span></li>
              <li className="flex items-start gap-2"><Heart className="w-4 h-4 text-[#f49d25] flex-shrink-0 mt-0.5" /><span>부탁 없이 동생과 놀아주기</span></li>
            </ul>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#2bb800]/20">
            <h4 className="font-display font-bold text-[#121811] mb-3">공감 보여주기</h4>
            <ul className="space-y-2 text-[#688961] text-sm">
              <li className="flex items-start gap-2"><Heart className="w-4 h-4 text-[#f49d25] flex-shrink-0 mt-0.5" /><span>슬픈 친구 위로하기</span></li>
              <li className="flex items-start gap-2"><Heart className="w-4 h-4 text-[#f49d25] flex-shrink-0 mt-0.5" /><span>속상한 형제자매에게 장난감 나눠주기</span></li>
              <li className="flex items-start gap-2"><Heart className="w-4 h-4 text-[#f49d25] flex-shrink-0 mt-0.5" /><span>선생님께 감사 편지 쓰기</span></li>
            </ul>
          </div>
        </div>
      </Section>

      <div className="bg-[#0ea5e9]/10 rounded-xl p-6 mt-8">
        <h3 className="font-display text-xl font-bold text-[#121811] mb-3">✨ 왜 중요한가요</h3>
        <p className="text-[#688961]">
          연구에 따르면 친사회적 행동을 인정하면 공감과 감성 지능이 높아집니다. 친절 시스템은 습관과 함께 인격을 형성하는 데 도움을 줍니다. "친절함에 대가를 지불하는 것"이 아니라, 자녀가 어떤 사람이 되어가고 있는지 알아차리고 축하하는 것입니다.
        </p>
      </div>
    </div>
  );
}

function SettingsGuide() {
  return (
    <div className="prose prose-lg max-w-none">
      <h1 className="font-display text-5xl font-bold text-[#121811] mb-6">설정 & 맞춤 설정</h1>
      <p className="text-xl text-[#688961] mb-8">가족에게 완벽하게 작동하도록 EarnQuest를 구성하세요.</p>

      <Section title="기기 연결">
        <p className="text-[#688961] mb-4">자녀의 EarnQuest 접근 설정:</p>
        <SettingItem
          title="가족 참여 코드"
          description="자녀가 계정에 접근하기 위해 입력하는 고유한 6자리 코드 (예: 'ABC123'). 필요 시 이 코드를 복사하거나 새 코드를 생성할 수 있습니다."
        />
        <div className="bg-yellow-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-[#688961]"><strong>⚠️ 참고:</strong> 새 코드를 생성하면 이전 코드가 비활성화됩니다. 이전 코드를 사용하던 모든 기기에서 새 코드를 다시 입력해야 합니다.</p>
        </div>
      </Section>

      <Section title="자녀 로그인 보안">
        <SettingItem
          title="PIN 보호"
          description="자녀 로그인 시 4자리 PIN을 요구하도록 설정합니다. 활성화하면 각 자녀마다 고유한 PIN이 필요합니다 (기본값: 0000)."
        />
        <SettingItem
          title="개별 자녀 PIN"
          description="각 자녀에게 고유한 4자리 PIN을 설정하세요. 이 섹션에서 언제든지 PIN을 변경할 수 있습니다."
        />
      </Section>

      <Section title="환율">
        <p className="text-[#688961] mb-4">보상 가격을 일관되게 책정하기 위한 참조 환율을 설정하세요:</p>
        <div className="grid grid-cols-5 gap-2 my-4">
          <div className="bg-gray-50 rounded-lg p-2 text-center text-sm">10 XP = ₩1,000</div>
          <div className="bg-gray-50 rounded-lg p-2 text-center text-sm">20 XP = ₩1,000</div>
          <div className="bg-gray-50 rounded-lg p-2 text-center text-sm">50 XP = ₩1,000</div>
          <div className="bg-green-100 rounded-lg p-2 text-center text-sm font-medium">100 XP = ₩1,000 ✓</div>
          <div className="bg-gray-50 rounded-lg p-2 text-center text-sm">200 XP = ₩1,000</div>
        </div>
        <p className="text-sm text-[#688961]">이것은 참조용으로만 사용됩니다 - 보상과 목표 가격을 일관되게 책정하는 데 도움이 되지만 자녀 계정에는 영향을 미치지 않습니다.</p>
      </Section>

      <Section title="공동 부모 접근">
        <SettingItem
          title="공동 부모 초대"
          description="파트너와 공유할 7일 유효 초대 링크를 생성하세요. 가족 계정에 합류하여 태스크와 승인을 함께 관리할 수 있습니다."
        />
        <SettingItem
          title="대기 중인 초대"
          description="만료일과 함께 미결 초대를 확인하고 관리하세요."
        />
      </Section>

      <Section title="자녀 관리">
        <p className="text-[#688961] mb-4"><strong>설정 → 자녀 관리</strong>로 이동하여:</p>
        <ul className="space-y-2 text-[#688961]">
          <li>• <strong>자녀 추가</strong> - 이름, 생년월일, 선택적 PIN 입력</li>
          <li>• <strong>프로필 편집</strong> - 이름, 생년월일 또는 아바타 업데이트</li>
          <li>• <strong>아바타 변경</strong> - 사진 업로드, 셀카 촬영 또는 프리셋 선택</li>
          <li>• <strong>자녀로 보기</strong> - 자녀가 대시보드에서 보는 것과 정확히 동일하게 확인</li>
        </ul>
        <div className="bg-gray-50 rounded-lg p-4 mt-4">
          <p className="text-sm text-[#688961]">각 자녀 카드에는 현재 XP 잔액, 연령대, 합류 시기가 표시됩니다.</p>
        </div>
      </Section>

      <Section title="아바타 옵션">
        <p className="text-[#688961] mb-4">부모와 자녀 모두 아바타를 커스터마이즈할 수 있습니다:</p>
        <ul className="space-y-2 text-[#688961]">
          <li>• <strong>📷 사진 촬영</strong> - 기기 카메라로 셀카 촬영</li>
          <li>• <strong>📁 이미지 업로드</strong> - 기기에서 선택 (최대 5MB)</li>
          <li>• <strong>🎨 프리셋 아바타</strong> - 미리 만들어진 아바타 갤러리에서 선택</li>
        </ul>
      </Section>

      <div className="bg-[#2bb800]/10 rounded-xl p-6 mt-8">
        <h3 className="font-display text-xl font-bold text-[#121811] mb-3">⚙️ 프로 팁</h3>
        <ul className="space-y-2 text-[#688961]">
          <li>✓ 공유 기기에서는 PIN 보호를 활성화하세요</li>
          <li>✓ 공동 부모를 초기에 초대하여 둘 다 승인을 도울 수 있게 하세요</li>
          <li>✓ "자녀로 보기"를 사용하여 자녀 경험을 이해하세요</li>
          <li>✓ 자녀가 성장함에 따라 매월 설정을 검토하세요</li>
          <li>✓ 환율을 사용하여 실제 물품처럼 보상 가격을 책정하세요</li>
        </ul>
      </div>
    </div>
  );
}

function SettingItem({ title, description }: any) {
  return (
    <div className="mb-6 pb-6 border-b border-[#688961]/20 last:border-0">
      <h4 className="font-display text-xl font-semibold text-[#121811] mb-2">{title}</h4>
      <p className="text-[#688961]">{description}</p>
    </div>
  );
}

// Helper Components
function Section({ title, children }: any) {
  return (
    <div className="mt-12 first:mt-0">
      <h2 className="font-display text-3xl font-bold text-[#121811] mb-6">{title}</h2>
      {children}
    </div>
  );
}

function SubSection({ title, children }: any) {
  return (
    <div className="mt-6">
      <h3 className="font-display text-xl font-semibold text-[#121811] mb-3">{title}</h3>
      {children}
    </div>
  );
}

function StepItem({ number, title, description, items }: any) {
  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-[#2bb800] text-white font-bold flex items-center justify-center">
          {number}
        </div>
      </div>
      <div className="flex-1">
        <h4 className="font-display text-xl font-bold text-[#121811] mb-2">{title}</h4>
        <p className="text-[#688961] mb-2">{description}</p>
        {items && (
          <ul className="space-y-1 text-[#688961] text-sm">
            {items.map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#2bb800] mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// Navigation Data
const sections = [
  { id: 'getting-started', title: '시작하기', icon: Home },
  { id: 'parent-guide', title: '부모 가이드', icon: Users },
  { id: 'child-guide', title: '어린이 가이드', icon: Baby },
  { id: 'tasks', title: '태스크 시스템', icon: CheckCircle },
  { id: 'rewards', title: '보상 스토어', icon: Gift },
  { id: 'kindness', title: '친절 시스템', icon: Heart },
  { id: 'settings', title: '설정', icon: Settings },
];
