/* eslint-disable @next/next/no-html-link-for-pages */
/* eslint-disable react/no-unescaped-entities */

import { Sparkle, Target, Heart, TrendUp, Users, Shield, Lightning, Medal } from '@phosphor-icons/react/dist/ssr';
import Image from 'next/image';
import Link from 'next/link';

export default function PamphletPageKo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f6f8f6] via-white to-[#f6f8f6]">
      {/* Hero Section with Family Image */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2bb800] via-[#25a000] to-[#1d8500] text-white pt-6 pb-24 px-6">
        {/* Navigation Header */}
        <nav className="max-w-6xl mx-auto mb-12 relative z-20">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm p-1">
                <Image src="/logo.png" alt="EarnQuest" width={32} height={32} />
              </div>
              <span className="font-display text-xl font-bold text-white">EarnQuest</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/ko/manual" className="text-white/80 hover:text-white transition-colors font-medium">
                매뉴얼
              </a>
              <Link href="/ko-KR/login" className="bg-white/20 hover:bg-white/30 px-5 py-2 rounded-full text-white font-semibold backdrop-blur-sm transition-all">
                로그인
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="text-center md:text-left">
              <div className="inline-block mb-6">
                <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm p-3 shadow-lg">
                  <Image src="/logo.png" alt="EarnQuest" width={80} height={80} />
                </div>
              </div>
              <h1 className="font-display text-6xl md:text-7xl font-bold mb-6 tracking-tight">
                EarnQuest
              </h1>
              <p className="text-2xl md:text-3xl font-light mb-6 opacity-95">
                습관을 키우고, 보상은 빛나요
              </p>
              <p className="text-lg md:text-xl font-body opacity-90 leading-relaxed mb-8">
                가족 일상을 신나는 모험으로 바꿔보세요. 동기부여, 신뢰, 긍정적 강화를 통해 아이들이 평생 지속될 습관을 만들어가는 모습을 지켜보세요.
              </p>
              <Link href="/ko-KR/signup" className="inline-block bg-white text-[#2bb800] px-10 py-4 rounded-full text-lg font-bold hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-xl">
                무료로 시작하기
              </Link>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                <Image
                  src="/images/pamphlet/gemini/hero-family-celebration-by-gemini.png"
                  alt="EarnQuest로 성취를 축하하는 행복한 가족"
                  width={600}
                  height={600}
                  className="w-full h-auto rounded-2xl"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      </section>

      {/* Core Features */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="font-display text-5xl md:text-6xl font-bold text-[#121811] mb-6">
            가족들이 EarnQuest를 사랑하는 이유
          </h2>
          <p className="text-xl text-[#688961] max-w-2xl mx-auto">
            좋은 습관을 성취감으로 만드는 완전한 동기부여 시스템
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-5xl md:text-6xl font-bold text-center text-[#121811] mb-12">
            간단하고. 강력하고. 효과적입니다.
          </h2>

          {/* Journey Infographic */}
          <div className="mb-16 flex justify-center">
            <div className="relative max-w-4xl w-full">
              <Image
                src="/images/pamphlet/gemini/journey-infographic.png-by-gemini.png"
                alt="여정: 태스크 → 포인트 → 보상"
                width={1200}
                height={600}
                className="w-full h-auto rounded-2xl"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <StepCard key={index} {...step} number={index + 1} />
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-[#2bb800]/10 via-white to-[#0ea5e9]/10 rounded-3xl p-12 md:p-20 shadow-xl">
          <h2 className="font-display text-5xl md:text-6xl font-bold text-[#121811] mb-16 text-center">
            심리학으로 설계하고,<br />가족을 위해 제작했습니다
          </h2>

          <div className="grid md:grid-cols-2 gap-10">
            {benefits.map((benefit, index) => (
              <BenefitItem key={index} {...benefit} />
            ))}
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-[#2bb800] via-[#25a000] to-[#1d8500] text-white relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="font-display text-5xl md:text-6xl font-bold mb-8">
            우리 가족의 퀘스트를 지금 시작하세요
          </h2>
          <p className="text-2xl mb-12 opacity-95">
            더 나은 습관을 함께 만들어가는 수천 가족과 함께하세요
          </p>
          <Link href="/ko-KR/signup" className="inline-block bg-white text-[#2bb800] px-16 py-5 rounded-full text-xl font-bold hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-2xl">
            무료로 시작하기
          </Link>
          <p className="mt-8 text-sm opacity-75">신용카드 불필요 • 영구 무료 플랜 제공</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#132210] text-white py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image src="/logo.png" alt="EarnQuest" width={40} height={40} />
                <h3 className="font-display text-2xl font-bold">EarnQuest</h3>
              </div>
              <p className="text-[#688961]">습관을 키우고, 보상은 빛나요</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">제품</h4>
              <ul className="space-y-2 text-[#688961]">
                <li><a href="#" className="hover:text-white transition-colors">기능</a></li>
                <li><a href="#" className="hover:text-white transition-colors">가격</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">지원</h4>
              <ul className="space-y-2 text-[#688961]">
                <li><a href="/ko/manual" className="hover:text-white transition-colors">사용자 매뉴얼</a></li>
                <li><a href="#" className="hover:text-white transition-colors">문의</a></li>
                <li><a href="#" className="hover:text-white transition-colors">개인정보</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#688961]/30 pt-8 text-center text-[#688961] text-sm">
            © 2026 EarnQuest. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon: Icon, title, description, color }: any) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-all duration-300 group">
      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
        <Icon size={32} className="text-white" aria-hidden="true" />
      </div>
      <h3 className="font-display text-2xl font-bold text-[#121811] mb-4">
        {title}
      </h3>
      <p className="text-[#688961] leading-relaxed">
        {description}
      </p>
    </div>
  );
}

// Step Card Component
function StepCard({ number, title, description }: any) {
  return (
    <div className="text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#2bb800] to-[#229900] text-white text-3xl font-bold flex items-center justify-center mx-auto mb-8 shadow-lg">
        {number}
      </div>
      <h3 className="font-display text-3xl font-bold text-[#121811] mb-5">
        {title}
      </h3>
      <p className="text-[#688961] leading-relaxed text-lg">
        {description}
      </p>
    </div>
  );
}

// Benefit Item Component
function BenefitItem({ icon: Icon, title, description }: any) {
  return (
    <div className="flex gap-5">
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-xl bg-[#2bb800]/10 flex items-center justify-center">
          <Icon size={28} className="text-[#2bb800]" aria-hidden="true" />
        </div>
      </div>
      <div>
        <h4 className="font-display text-2xl font-bold text-[#121811] mb-3">
          {title}
        </h4>
        <p className="text-[#688961] text-lg leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

// Data
const features = [
  {
    icon: Target,
    title: "스마트 태스크 시스템",
    description: "아이와 함께 성장하는 연령별 맞춤 태스크. 숙제부터 집안일까지 한 곳에서 자동 알림과 함께 관리하세요.",
    color: "from-[#2bb800] to-[#229900]"
  },
  {
    icon: Sparkle,
    title: "동기부여되는 보상",
    description: "아이들이 진짜 원하는 스크린타임, 경험, 특권. 동기부여를 의미 있는 보상으로 전환하세요.",
    color: "from-[#0ea5e9] to-[#0284c7]"
  },
  {
    icon: Heart,
    title: "친절 인정 시스템",
    description: "친절한 행동과 친사회적 행위를 축하하는 특별한 시스템. 습관과 함께 공감능력을 키워주세요.",
    color: "from-[#f49d25] to-[#dc8b1e]"
  },
  {
    icon: TrendUp,
    title: "신뢰 레벨",
    description: "아이가 책임감을 보여줄수록 자율성을 점진적으로 높여주세요. 시간이 지남에 따라 더욱 독립적으로 성장하는 모습을 지켜보세요.",
    color: "from-[#8b5cf6] to-[#7c3aed]"
  },
  {
    icon: Users,
    title: "가족 대시보드",
    description: "모든 가족 구성원을 위한 하나의 공간. 진행 상황을 추적하고, 태스크를 승인하고, 함께 성공을 축하하세요.",
    color: "from-[#ec4899] to-[#db2777]"
  },
  {
    icon: Shield,
    title: "연령별 맞춤",
    description: "5-14세를 위해 세심하게 설계된 프리셋. 모든 단계에서 적절한 도전과 달성 가능성의 균형을 제공합니다.",
    color: "from-[#14b8a6] to-[#0d9488]"
  }
];

const steps = [
  {
    title: "태스크 설정",
    description: "연령별 프리셋에서 선택하거나 직접 맞춤 설정하세요. 포인트, 승인 방법, 일정을 몇 분 만에 설정할 수 있습니다."
  },
  {
    title: "아이가 완료",
    description: "아이들이 태스크를 보고, 완료하고, 승인을 요청합니다. 아이들을 위해 디자인된 명확하고 시각적이며 동기부여되는 인터페이스."
  },
  {
    title: "포인트 획득 & 교환",
    description: "포인트가 자동으로 쌓입니다. 아이들이 스토어를 둘러보고 번 포인트로 보상을 교환합니다. 책임감과 지연된 만족을 가르칩니다."
  }
];

const benefits = [
  {
    icon: Lightning,
    title: "즉각적인 동기부여",
    description: "\"하기 싫어\"를 \"빨리 하고 싶어!\"로 바꿔보세요. 게임화된 진행 추적과 시각적 보상으로 가능합니다."
  },
  {
    icon: Medal,
    title: "실제 기술 형성",
    description: "책임감, 시간 관리, 지연된 만족 - 평생 지속될 습관을 만들어갑니다."
  },
  {
    icon: Heart,
    title: "유대감 강화",
    description: "태스크와 스크린타임에 대한 갈등을 줄이세요. 서로의 존재를 즐기는 질 높은 시간을 더 많이 보내세요."
  },
  {
    icon: Shield,
    title: "과학적 근거",
    description: "행동 심리학과 긍정적 강화를 기반으로 합니다. 지속적인 행동 변화를 위한 검증된 기법."
  }
];
