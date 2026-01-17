/* eslint-disable @next/next/no-html-link-for-pages */
/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState } from 'react';
import { BookOpen, Users, Baby, Settings, Gift, Heart, CheckCircle, Home } from 'lucide-react';

export default function ManualPageKo() {
  const [activeSection, setActiveSection] = useState('getting-started');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f6f8f6] to-white">
      {/* Header */}
      <header className="bg-white border-b border-[#2bb800]/20 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-[#2bb800]" />
            <div>
              <h1 className="font-display text-2xl font-bold text-[#121811]">EarnQuest 사용자 매뉴얼</h1>
              <p className="text-sm text-[#688961]">부모님과 아이들을 위한 완전한 가이드</p>
            </div>
          </div>
          <a href="/ko/pamphlet" className="text-[#2bb800] hover:text-[#229900] font-semibold flex items-center gap-2">
            <Home className="w-4 h-4" />
            홈으로
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12 flex gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-64 flex-shrink-0 sticky top-24 h-fit">
          <nav className="bg-white rounded-2xl p-6 shadow-card">
            <h3 className="font-display font-bold text-[#121811] mb-4 text-sm uppercase tracking-wide">목차</h3>
            <ul className="space-y-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
                      activeSection === section.id
                        ? 'bg-[#2bb800] text-white'
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
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="bg-white rounded-2xl p-12 shadow-card">
            {activeSection === 'getting-started' && <GettingStarted />}
            {activeSection === 'parent-guide' && <ParentGuide />}
            {activeSection === 'child-guide' && <ChildGuide />}
            {activeSection === 'tasks' && <TasksGuide />}
            {activeSection === 'rewards' && <RewardsGuide />}
            {activeSection === 'kindness' && <KindnessGuide />}
            {activeSection === 'settings' && <SettingsGuide />}
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
            <span>이메일 주소 또는 Google/Apple 계정</span>
          </li>
          <li className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[#2bb800]" />
            <span>자녀의 나이와 이름</span>
          </li>
        </ul>
      </div>

      <h2 className="font-display text-3xl font-bold text-[#121811] mt-10 mb-6">단계별 설정</h2>

      <StepItem
        number={1}
        title="계정 만들기"
        description="이메일, Google 또는 Apple 계정으로 가입하세요. 이것이 부모 계정이 됩니다."
      />

      <StepItem
        number={2}
        title="자녀 추가"
        description="자녀의 이름, 나이를 입력하고 아바타를 선택하세요. 같은 가족 계정에 여러 자녀를 추가할 수 있습니다."
      />

      <StepItem
        number={3}
        title="양육 스타일 선택"
        description="가족의 가치관에 맞는 세 가지 프리셋 중 선택하세요:"
        items={[
          "쉬운 시작 - 최소한의 태스크로 점진적으로 습관 형성",
          "균형잡힌 - 학습, 집안일, 건강 전반에 걸친 태스크 믹스",
          "학습 중심 - 숙제와 교육 활동 강조"
        ]}
      />

      <StepItem
        number={4}
        title="기본 태스크 & 보상 검토"
        description="선택에 따라 연령별로 적합한 태스크와 보상을 만들어 드렸습니다. 언제든지 맞춤 설정할 수 있습니다."
      />

      <StepItem
        number={5}
        title="시작 및 공유"
        description="자녀에게 앱을 보여주세요! 자녀의 대시보드를 함께 살펴보며 포인트를 획득하고 보상을 교환하는 방법을 설명해주세요."
      />

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

      <Section title="태스크 관리하기">
        <p className="text-[#688961] mb-4">부모로서 태스크 시스템을 완전히 제어할 수 있습니다.</p>

        <SubSection title="태스크 만들기">
          <ol className="space-y-3 text-[#688961]">
            <li>1. 부모 대시보드 → 태스크로 이동</li>
            <li>2. "태스크 추가" 클릭</li>
            <li>3. 태스크 세부정보 입력:
              <ul className="ml-6 mt-2 space-y-1">
                <li>• 태스크 이름과 설명</li>
                <li>• 카테고리 (학습, 집안일, 건강)</li>
                <li>• 포인트 값 (일반적으로 20-50 포인트)</li>
                <li>• 승인 방법</li>
              </ul>
            </li>
            <li>4. 일정 설정 (매일, 매주 또는 맞춤)</li>
            <li>5. 자녀에게 할당</li>
          </ol>
        </SubSection>

        <SubSection title="승인 방법">
          <ul className="space-y-3 text-[#688961]">
            <li className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-[#2bb800] flex-shrink-0 mt-1" />
              <div>
                <strong>부모 승인</strong> - 완료를 수동으로 검토하고 승인합니다
              </div>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-[#2bb800] flex-shrink-0 mt-1" />
              <div>
                <strong>자동 승인</strong> - 자녀가 완료 표시하면 시스템이 자동으로 승인 (신뢰할 수 있는 태스크용)
              </div>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-[#2bb800] flex-shrink-0 mt-1" />
              <div>
                <strong>타이머</strong> - 자녀가 타이머를 시작하면 타이머 종료 시 태스크가 자동 완료됩니다
              </div>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-[#2bb800] flex-shrink-0 mt-1" />
              <div>
                <strong>체크리스트</strong> - 자녀가 하위 항목을 체크하고 부모가 최종 체크리스트를 승인합니다
              </div>
            </li>
          </ul>
        </SubSection>
      </Section>

      <div className="bg-[#0ea5e9]/10 rounded-xl p-6 mt-8">
        <h3 className="font-display text-xl font-bold text-[#121811] mb-2">모범 사례</h3>
        <ul className="space-y-2 text-[#688961]">
          <li>✓ 태스크를 연령에 맞고 달성 가능하게 유지하세요</li>
          <li>✓ 다양한 태스크 카테고리의 균형을 맞추세요</li>
          <li>✓ 24시간 내에 태스크 승인에 응답하세요</li>
          <li>✓ 매월 포인트 값을 검토하고 조정하세요</li>
          <li>✓ 가족으로서 함께 이정표를 축하하세요</li>
        </ul>
      </div>
    </div>
  );
}

function ChildGuide() {
  return (
    <div className="prose prose-lg max-w-none">
      <h1 className="font-display text-5xl font-bold text-[#121811] mb-6">어린이 가이드</h1>
      <p className="text-xl text-[#688961] mb-8">태스크를 완료하고 포인트를 획득하며 멋진 보상을 받는 방법을 배워보세요!</p>

      <Section title="나만의 대시보드">
        <p className="text-[#688961] mb-4">EarnQuest를 열면 다음과 같은 개인 대시보드를 볼 수 있어요:</p>
        <ul className="space-y-3 text-[#688961]">
          <li className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2bb800]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">⭐</span>
            </div>
            <div>
              <strong>내 포인트</strong> - 지금까지 모은 포인트
            </div>
          </li>
          <li className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2bb800]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📋</span>
            </div>
            <div>
              <strong>오늘의 태스크</strong> - 포인트를 모을 수 있는 할 일들
            </div>
          </li>
          <li className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2bb800]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🏆</span>
            </div>
            <div>
              <strong>내 통계</strong> - 연속 기록, 총 포인트, 업적
            </div>
          </li>
        </ul>
      </Section>

      <Section title="태스크 완료하기">
        <p className="text-[#688961] mb-4">태스크를 완료하고 포인트를 모으는 방법:</p>

        <StepItem number={1} title="태스크 선택" description="태스크 목록을 보고 할 것을 선택하세요" />
        <StepItem number={2} title="태스크 수행" description="활동을 완료하세요! 잘 하도록 노력하세요." />
        <StepItem number={3} title="완료 표시" description="태스크를 탭하고 '완료 표시'를 클릭하세요. 일부 태스크는 사진이나 타이머가 필요해요." />
        <StepItem number={4} title="승인 기다리기" description="부모님이 확인하고 승인하면 포인트를 받을 수 있어요!" />
      </Section>

      <div className="bg-[#f49d25]/10 rounded-xl p-6 mt-8">
        <h3 className="font-display text-xl font-bold text-[#121811] mb-3">🌟 특별: 친절 포인트</h3>
        <p className="text-[#688961] mb-3">
          부모님이 말씀하시지 않았는데 친절한 행동을 했나요? 부모님에게 알려주세요! 친절 행동으로 보너스 포인트를 받을 수 있어요.
        </p>
        <p className="text-[#688961] font-semibold">
          예시: 형제자매 돕기, 장난감 나눠 쓰기, 슬픈 사람 위로하기
        </p>
      </div>

      <div className="bg-[#2bb800]/10 rounded-xl p-6 mt-6">
        <h3 className="font-display text-xl font-bold text-[#121811] mb-3">성공을 위한 팁 💪</h3>
        <ul className="space-y-2 text-[#688961]">
          <li>✓ 매일 아침 태스크를 확인하세요</li>
          <li>✓ 놀기 전에 태스크를 해요</li>
          <li>✓ 완료를 증명할 사진을 찍으세요</li>
          <li>✓ 더 큰 보상을 위해 포인트를 저축하세요</li>
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
        <div className="grid md:grid-cols-3 gap-6 my-6">
          <div className="bg-[#2bb800]/10 rounded-xl p-6">
            <h4 className="font-display text-xl font-bold text-[#121811] mb-3">📚 학습</h4>
            <p className="text-[#688961] text-sm">숙제, 독서, 교육 앱, 악기 연습</p>
          </div>
          <div className="bg-[#0ea5e9]/10 rounded-xl p-6">
            <h4 className="font-display text-xl font-bold text-[#121811] mb-3">🏠 집안일</h4>
            <p className="text-[#688961] text-sm">방 정리, 설거지, 빨래, 반려동물 돌보기, 마당 정리</p>
          </div>
          <div className="bg-[#f49d25]/10 rounded-xl p-6">
            <h4 className="font-display text-xl font-bold text-[#121811] mb-3">💪 건강</h4>
            <p className="text-[#688961] text-sm">운동, 양치질, 아침 루틴, 취침 루틴</p>
          </div>
        </div>
      </Section>

      <Section title="포인트 값 가이드">
        <p className="text-[#688961] mb-4">태스크 난이도와 시간에 따른 권장 포인트 값:</p>
        <ul className="space-y-3 text-[#688961]">
          <li><strong>10-20 포인트</strong> - 빠른 태스크 (5-10분): 양치질, 침대 정리</li>
          <li><strong>20-30 포인트</strong> - 중간 태스크 (10-20분): 방 정리, 15분 독서</li>
          <li><strong>30-50 포인트</strong> - 긴 태스크 (20-40분): 숙제, 30분 운동</li>
          <li><strong>50+ 포인트</strong> - 주요 태스크 (40분 이상): 방 대청소, 큰 학교 프로젝트</li>
        </ul>
      </Section>
    </div>
  );
}

function RewardsGuide() {
  return (
    <div className="prose prose-lg max-w-none">
      <h1 className="font-display text-5xl font-bold text-[#121811] mb-6">보상 스토어 가이드</h1>
      <p className="text-xl text-[#688961] mb-8">아이들이 좋아할 동기부여되는 보상을 만드세요.</p>

      <Section title="보상 유형">
        <div className="space-y-6">
          <div className="border-l-4 border-[#2bb800] pl-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">📱</span>
              <h3 className="font-display text-2xl font-bold text-[#121811]">스크린 타임</h3>
            </div>
            <p className="text-[#688961] mb-3">디지털 기기 시간 - 가장 요청이 많은 보상!</p>
            <ul className="space-y-1 text-[#688961] text-sm">
              <li>• 30분 아이패드 시간 - 100 포인트</li>
              <li>• 1시간 비디오 게임 시간 - 150 포인트</li>
              <li>• 영화 보기 - 200 포인트</li>
            </ul>
          </div>

          <div className="border-l-4 border-[#0ea5e9] pl-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🎉</span>
              <h3 className="font-display text-2xl font-bold text-[#121811]">경험</h3>
            </div>
            <p className="text-[#688961] mb-3">재미있는 활동과 특별한 시간</p>
            <ul className="space-y-1 text-[#688961] text-sm">
              <li>• 가족 영화 선택 - 150 포인트</li>
              <li>• 추가 취침 이야기 - 80 포인트</li>
              <li>• 친구와 슬립오버 - 300 포인트</li>
            </ul>
          </div>
        </div>
      </Section>

      <div className="bg-[#0ea5e9]/10 rounded-xl p-6 mt-8">
        <h3 className="font-display text-xl font-bold text-[#121811] mb-3">💡 모범 사례</h3>
        <ul className="space-y-2 text-[#688961]">
          <li>✓ 빠른 달성과 큰 목표를 혼합해서 제공하세요</li>
          <li>✓ 비물질적 보상(경험, 특권)을 포함하세요</li>
          <li>✓ 계절별로 스토어를 업데이트해서 신선함을 유지하세요</li>
          <li>✓ 아이들이 원하는 보상을 제안하게 하세요</li>
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
          친절 시스템은 일반 태스크와 별개입니다. 자녀가 공감을 보이거나, 다른 사람을 돕거나, 부탁하지 않았는데 친절한 일을 할 때 이를 알아차리고 축하하기 위해 설계되었습니다. 이러한 순간들은 소중합니다 - 시스템이 이를 포착하고 축하하도록 도와줍니다.
        </p>
      </div>

      <Section title="작동 방식">
        <ol className="space-y-4 text-[#688961]">
          <li>
            <strong className="text-[#121811]">자녀가 보고하거나 부모가 알아차림</strong>
            <p className="mt-1">친절한 행동이 일어나면 자녀가 보고하거나 부모님이 추가할 수 있어요</p>
          </li>
          <li>
            <strong className="text-[#121811]">부모가 검토하고 승인</strong>
            <p className="mt-1">왜 친절했는지에 대한 짧은 메모를 작성하고 승인합니다</p>
          </li>
          <li>
            <strong className="text-[#121811]">자녀가 인정받음</strong>
            <p className="mt-1">보너스 포인트가 수여되고 프로필에 특별한 배지가 추가됩니다</p>
          </li>
          <li>
            <strong className="text-[#121811]">친절 기록 만들기</strong>
            <p className="mt-1">모든 친절 행동이 저장됩니다 - 성장의 아름다운 기록</p>
          </li>
        </ol>
      </Section>
    </div>
  );
}

function SettingsGuide() {
  return (
    <div className="prose prose-lg max-w-none">
      <h1 className="font-display text-5xl font-bold text-[#121811] mb-6">설정 & 맞춤 설정</h1>
      <p className="text-xl text-[#688961] mb-8">가족에게 완벽하게 작동하도록 EarnQuest를 구성하세요.</p>

      <Section title="가족 설정">
        <div className="space-y-6">
          <div className="pb-6 border-b border-[#688961]/20">
            <h4 className="font-display text-xl font-semibold text-[#121811] mb-2">자녀 추가/제거</h4>
            <p className="text-[#688961]">가족 계정의 일부인 자녀를 관리하세요. 각 자녀는 자신만의 프로필과 진행 상황 추적을 받습니다.</p>
          </div>
          <div className="pb-6 border-b border-[#688961]/20">
            <h4 className="font-display text-xl font-semibold text-[#121811] mb-2">부모 계정</h4>
            <p className="text-[#688961]">파트너나 공동 부모를 추가하여 둘 다 태스크를 승인하고 시스템을 관리할 수 있습니다.</p>
          </div>
          <div className="pb-6 border-b border-[#688961]/20">
            <h4 className="font-display text-xl font-semibold text-[#121811] mb-2">알림 설정</h4>
            <p className="text-[#688961]">받을 알림을 선택하세요: 태스크 완료, 보상 교환, 이정표 또는 일일 요약.</p>
          </div>
        </div>
      </Section>

      <div className="bg-[#2bb800]/10 rounded-xl p-6 mt-8">
        <h3 className="font-display text-xl font-bold text-[#121811] mb-3">⚙️ 프로 팁</h3>
        <ul className="space-y-2 text-[#688961]">
          <li>✓ 자녀가 성장하면서 매월 설정을 검토하세요</li>
          <li>✓ 태스크 완료 알림을 활성화하여 신속하게 응답하세요</li>
          <li>✓ 보상이 너무 빨리 또는 느리게 교환되면 포인트 값을 조정하세요</li>
          <li>✓ 일관된 책임감에 대한 보상으로 신뢰 레벨을 사용하세요</li>
        </ul>
      </div>
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
