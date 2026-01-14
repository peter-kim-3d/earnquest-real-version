# 구현 지시서: EarnQuest 티켓 사용(Redemption) 시스템

## 📋 개요

리워드 구매 후 **티켓 사용** 프로세스를 구현한다. 카테고리별로 다른 플로우를 적용하여, 스크린 타임은 부모 승인이 필요하고, 저축/자율권은 즉시 완료되며, 경험/물건은 부모가 지급 처리한다.

### 핵심 변경 사항
1. 티켓 상태 모델 변경: `purchased/fulfilled` → `active/use_requested/used`
2. 카테고리 기반 플로우 분기 (새 필드 없이 기존 구조 활용)
3. 가드레일: 동시에 `use_requested` 상태인 티켓 1개 제한
4. 아이/부모 UI 분리된 액션

### 설계 결정 (확정)

| 카테고리 | 구매 후 상태 | 완료 방법 | 아이 액션 | 부모 액션 |
|----------|-------------|----------|----------|----------|
| `savings`, `autonomy` | 즉시 `used` | 자동 | 없음 | 없음 |
| `screen` | `active` | 아이 요청 → 부모 승인 | "Use Now" | "Approve" |
| `item`, `experience` | `active` | 부모 지급 | 없음 | "Mark as Given" |

---

## 🗄️ 1. Database Migration

### 파일: `supabase/migrations/0XX_ticket_redemption_system.sql`

```sql
-- ============================================
-- 티켓 사용(Redemption) 시스템 마이그레이션
-- ============================================

-- 1. reward_purchases 테이블에 used_at 컬럼 추가
ALTER TABLE reward_purchases 
ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;

-- 2. 기존 status 값 마이그레이션
-- 'purchased' → 'active' (보유 중)
-- 'fulfilled' → 'used' (완료)
-- 'expired', 'cancelled'는 그대로 유지

UPDATE reward_purchases 
SET status = 'active' 
WHERE status = 'purchased';

UPDATE reward_purchases 
SET status = 'used',
    used_at = COALESCE(fulfilled_at, updated_at)
WHERE status = 'fulfilled';

-- 3. status 체크 제약조건 업데이트 (선택사항)
-- ALTER TABLE reward_purchases 
-- DROP CONSTRAINT IF EXISTS reward_purchases_status_check;
-- 
-- ALTER TABLE reward_purchases 
-- ADD CONSTRAINT reward_purchases_status_check 
-- CHECK (status IN ('active', 'use_requested', 'used', 'expired', 'cancelled'));

-- 4. use_requested 상태 인덱스 (가드레일 쿼리 최적화)
CREATE INDEX IF NOT EXISTS idx_reward_purchases_use_requested 
ON reward_purchases(child_id, status) 
WHERE status = 'use_requested';

-- 5. 즉시 완료 리워드 처리를 위한 함수 업데이트
-- purchase_reward 함수에서 카테고리 체크 후 즉시 완료 처리

CREATE OR REPLACE FUNCTION purchase_reward(
  p_reward_id UUID,
  p_child_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_reward rewards%ROWTYPE;
  v_child children%ROWTYPE;
  v_family families%ROWTYPE;
  v_weekly_purchases INT;
  v_weekly_screen INT;
  v_new_balance INT;
  v_purchase_id UUID;
  v_initial_status VARCHAR(20);
BEGIN
  -- 리워드 조회
  SELECT * INTO v_reward FROM rewards WHERE id = p_reward_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reward not found');
  END IF;
  
  -- 아이 조회
  SELECT * INTO v_child FROM children WHERE id = p_child_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Child not found');
  END IF;
  
  -- 포인트 충분?
  IF v_child.points_balance < v_reward.points THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient points');
  END IF;
  
  -- 주간 제한 확인
  IF v_reward.weekly_limit IS NOT NULL THEN
    SELECT COUNT(*) INTO v_weekly_purchases
    FROM reward_purchases
    WHERE reward_id = p_reward_id
    AND child_id = p_child_id
    AND purchased_at >= DATE_TRUNC('week', NOW())
    AND status NOT IN ('cancelled');
    
    IF v_weekly_purchases >= v_reward.weekly_limit THEN
      RETURN jsonb_build_object('success', false, 'error', 'Weekly limit reached');
    END IF;
  END IF;
  
  -- 스크린 예산 확인
  IF v_reward.is_screen_reward THEN
    SELECT COALESCE(SUM(r.screen_minutes), 0) INTO v_weekly_screen
    FROM reward_purchases rp
    JOIN rewards r ON rp.reward_id = r.id
    WHERE rp.child_id = p_child_id
    AND r.is_screen_reward = true
    AND rp.purchased_at >= DATE_TRUNC('week', NOW())
    AND rp.status NOT IN ('cancelled');
    
    SELECT * INTO v_family FROM families WHERE id = v_child.family_id;
    
    IF v_weekly_screen + v_reward.screen_minutes > 
       (v_family.settings->>'screenBudgetWeeklyMinutes')::INT THEN
      RETURN jsonb_build_object('success', false, 'error', 'Screen budget exceeded');
    END IF;
  END IF;
  
  -- 카테고리에 따른 초기 상태 결정
  -- savings, autonomy는 즉시 완료
  IF v_reward.category IN ('savings', 'autonomy') THEN
    v_initial_status := 'used';
  ELSE
    v_initial_status := 'active';
  END IF;
  
  -- 구매 기록 생성
  INSERT INTO reward_purchases (
    reward_id, child_id, family_id, reward_name, points_spent, status, used_at
  ) VALUES (
    p_reward_id, p_child_id, v_child.family_id, v_reward.name, v_reward.points, 
    v_initial_status,
    CASE WHEN v_initial_status = 'used' THEN NOW() ELSE NULL END
  ) RETURNING id INTO v_purchase_id;
  
  -- 포인트 차감
  v_new_balance := add_points(
    p_child_id,
    -v_reward.points,
    'reward_purchase',
    'reward_purchase',
    v_purchase_id,
    v_reward.name || ' 구매'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'purchase_id', v_purchase_id,
    'points_spent', v_reward.points,
    'new_balance', v_new_balance,
    'status', v_initial_status,
    'is_instant', v_initial_status = 'used'
  );
END;
$$ LANGUAGE plpgsql;

-- 6. 티켓 사용 요청 함수
CREATE OR REPLACE FUNCTION request_ticket_use(
  p_purchase_id UUID,
  p_child_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_purchase reward_purchases%ROWTYPE;
  v_reward rewards%ROWTYPE;
  v_pending_count INT;
BEGIN
  -- 티켓 조회
  SELECT * INTO v_purchase FROM reward_purchases WHERE id = p_purchase_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ticket not found');
  END IF;
  
  -- 본인 티켓인지 확인
  IF v_purchase.child_id != p_child_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not your ticket');
  END IF;
  
  -- active 상태인지 확인
  IF v_purchase.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ticket not available for use');
  END IF;
  
  -- 리워드 조회
  SELECT * INTO v_reward FROM rewards WHERE id = v_purchase.reward_id;
  
  -- 스크린 타입만 사용 요청 가능
  IF NOT v_reward.is_screen_reward THEN
    RETURN jsonb_build_object('success', false, 'error', 'This reward type cannot be requested');
  END IF;
  
  -- 가드레일: 이미 pending인 티켓이 있는지 확인
  SELECT COUNT(*) INTO v_pending_count
  FROM reward_purchases
  WHERE child_id = p_child_id
  AND status = 'use_requested';
  
  IF v_pending_count >= 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already have a pending request');
  END IF;
  
  -- 상태 업데이트
  UPDATE reward_purchases
  SET status = 'use_requested',
      updated_at = NOW()
  WHERE id = p_purchase_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'purchase_id', p_purchase_id,
    'status', 'use_requested'
  );
END;
$$ LANGUAGE plpgsql;

-- 7. 티켓 사용 승인 함수 (부모용)
CREATE OR REPLACE FUNCTION approve_ticket_use(
  p_purchase_id UUID,
  p_parent_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_purchase reward_purchases%ROWTYPE;
  v_parent users%ROWTYPE;
BEGIN
  -- 부모 조회
  SELECT * INTO v_parent FROM users WHERE id = p_parent_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Parent not found');
  END IF;
  
  -- 티켓 조회
  SELECT * INTO v_purchase FROM reward_purchases WHERE id = p_purchase_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ticket not found');
  END IF;
  
  -- 같은 가족인지 확인
  IF v_purchase.family_id != v_parent.family_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not your family');
  END IF;
  
  -- use_requested 상태인지 확인
  IF v_purchase.status != 'use_requested' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ticket not pending approval');
  END IF;
  
  -- 상태 업데이트
  UPDATE reward_purchases
  SET status = 'used',
      fulfilled_by = p_parent_id,
      fulfilled_at = NOW(),
      used_at = NOW(),
      updated_at = NOW()
  WHERE id = p_purchase_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'purchase_id', p_purchase_id,
    'status', 'used'
  );
END;
$$ LANGUAGE plpgsql;

-- 8. 티켓 지급 완료 함수 (부모용, 경험/물건 타입)
CREATE OR REPLACE FUNCTION fulfill_ticket(
  p_purchase_id UUID,
  p_parent_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_purchase reward_purchases%ROWTYPE;
  v_parent users%ROWTYPE;
  v_reward rewards%ROWTYPE;
BEGIN
  -- 부모 조회
  SELECT * INTO v_parent FROM users WHERE id = p_parent_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Parent not found');
  END IF;
  
  -- 티켓 조회
  SELECT * INTO v_purchase FROM reward_purchases WHERE id = p_purchase_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ticket not found');
  END IF;
  
  -- 같은 가족인지 확인
  IF v_purchase.family_id != v_parent.family_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not your family');
  END IF;
  
  -- active 상태인지 확인
  IF v_purchase.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ticket not available');
  END IF;
  
  -- 리워드 조회
  SELECT * INTO v_reward FROM rewards WHERE id = v_purchase.reward_id;
  
  -- 스크린 타입은 이 함수로 처리 불가 (사용 요청 플로우 사용해야 함)
  IF v_reward.is_screen_reward THEN
    RETURN jsonb_build_object('success', false, 'error', 'Screen rewards require use request flow');
  END IF;
  
  -- 상태 업데이트
  UPDATE reward_purchases
  SET status = 'used',
      fulfilled_by = p_parent_id,
      fulfilled_at = NOW(),
      used_at = NOW(),
      updated_at = NOW()
  WHERE id = p_purchase_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'purchase_id', p_purchase_id,
    'status', 'used'
  );
END;
$$ LANGUAGE plpgsql;
```

---

## 🔌 2. API Routes

### 2.1 티켓 사용 요청 (아이용)

**파일**: `app/api/tickets/[id]/request-use/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  
  // 현재 사용자(아이) 확인 - 실제로는 child session에서 가져옴
  // MVP에서는 request body에서 childId를 받거나 세션에서 추출
  const body = await request.json();
  const { childId } = body;
  
  if (!childId) {
    return NextResponse.json({ error: 'Child ID required' }, { status: 400 });
  }
  
  const { data, error } = await supabase.rpc('request_ticket_use', {
    p_purchase_id: params.id,
    p_child_id: childId,
  });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  if (!data.success) {
    return NextResponse.json({ error: data.error }, { status: 400 });
  }
  
  return NextResponse.json(data);
}
```

### 2.2 티켓 사용 승인 (부모용)

**파일**: `app/api/tickets/[id]/approve/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  
  // 현재 사용자(부모) 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { data, error } = await supabase.rpc('approve_ticket_use', {
    p_purchase_id: params.id,
    p_parent_id: user.id,
  });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  if (!data.success) {
    return NextResponse.json({ error: data.error }, { status: 400 });
  }
  
  return NextResponse.json(data);
}
```

### 2.3 티켓 지급 완료 (부모용)

**파일**: `app/api/tickets/[id]/fulfill/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  
  // 현재 사용자(부모) 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { data, error } = await supabase.rpc('fulfill_ticket', {
    p_purchase_id: params.id,
    p_parent_id: user.id,
  });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  if (!data.success) {
    return NextResponse.json({ error: data.error }, { status: 400 });
  }
  
  return NextResponse.json(data);
}
```

### 2.4 아이의 티켓 목록 조회

**파일**: `app/api/children/[id]/tickets/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  
  // 티켓 목록 조회 (리워드 정보 join)
  const { data: tickets, error } = await supabase
    .from('reward_purchases')
    .select(`
      *,
      reward:rewards (
        id,
        name,
        description,
        category,
        icon,
        is_screen_reward,
        screen_minutes
      )
    `)
    .eq('child_id', params.id)
    .in('status', ['active', 'use_requested', 'used'])
    .order('purchased_at', { ascending: false });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // 상태별로 그룹핑
  const grouped = {
    active: tickets?.filter(t => t.status === 'active') || [],
    use_requested: tickets?.filter(t => t.status === 'use_requested') || [],
    used: tickets?.filter(t => t.status === 'used') || [],
  };
  
  return NextResponse.json(grouped);
}
```

---

## 🎨 3. UI Components

### 3.1 티켓 카드 컴포넌트

**파일**: `components/tickets/TicketCard.tsx`

```typescript
'use client';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TicketCardProps {
  ticket: {
    id: string;
    status: 'active' | 'use_requested' | 'used';
    reward_name: string;
    points_spent: number;
    purchased_at: string;
    used_at?: string;
    reward: {
      category: string;
      icon?: string;
      is_screen_reward: boolean;
      screen_minutes?: number;
    };
  };
  viewMode: 'child' | 'parent';
  onRequestUse?: (ticketId: string) => void;
  onApprove?: (ticketId: string) => void;
  onFulfill?: (ticketId: string) => void;
  hasPendingRequest?: boolean; // 가드레일용
}

export function TicketCard({
  ticket,
  viewMode,
  onRequestUse,
  onApprove,
  onFulfill,
  hasPendingRequest = false,
}: TicketCardProps) {
  const isScreen = ticket.reward.is_screen_reward;
  const isActive = ticket.status === 'active';
  const isPending = ticket.status === 'use_requested';
  const isUsed = ticket.status === 'used';
  
  // 상태별 배지
  const statusBadge = {
    active: null,
    use_requested: <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Waiting for Parent</Badge>,
    used: <Badge variant="outline" className="bg-green-50 text-green-700">Used</Badge>,
  };
  
  // 아이 뷰: 사용 버튼 (스크린 타입만)
  const showUseButton = viewMode === 'child' && isActive && isScreen;
  const useButtonDisabled = hasPendingRequest;
  
  // 부모 뷰: 승인 버튼 (use_requested 상태)
  const showApproveButton = viewMode === 'parent' && isPending;
  
  // 부모 뷰: 지급 완료 버튼 (active 상태, 비스크린)
  const showFulfillButton = viewMode === 'parent' && isActive && !isScreen;
  
  return (
    <Card className={cn(
      'transition-all',
      isUsed && 'opacity-60',
    )}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">
              {ticket.reward.icon || getCategoryIcon(ticket.reward.category)}
            </div>
            <div>
              <h3 className="font-semibold">{ticket.reward_name}</h3>
              {isScreen && ticket.reward.screen_minutes && (
                <p className="text-sm text-muted-foreground">
                  {ticket.reward.screen_minutes} minutes
                </p>
              )}
            </div>
          </div>
          {statusBadge[ticket.status]}
        </div>
        
        <div className="mt-3 text-sm text-muted-foreground">
          <span>{ticket.points_spent} QP</span>
          <span className="mx-2">·</span>
          <span>{formatDate(ticket.purchased_at)}</span>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        {/* 아이: 사용 버튼 */}
        {showUseButton && (
          <Button 
            onClick={() => onRequestUse?.(ticket.id)}
            disabled={useButtonDisabled}
            className="w-full"
          >
            {useButtonDisabled ? 'Already have a pending request' : 'Use Now'}
          </Button>
        )}
        
        {/* 아이: 비스크린 안내 */}
        {viewMode === 'child' && isActive && !isScreen && (
          <p className="text-sm text-muted-foreground text-center w-full">
            Ask your parent when you want to use this!
          </p>
        )}
        
        {/* 부모: 승인 버튼 */}
        {showApproveButton && (
          <div className="flex gap-2 w-full">
            <Button 
              onClick={() => onApprove?.(ticket.id)}
              className="flex-1"
            >
              Approve
            </Button>
            <Button 
              variant="outline"
              className="flex-1"
            >
              Not Now
            </Button>
          </div>
        )}
        
        {/* 부모: 지급 완료 버튼 */}
        {showFulfillButton && (
          <Button 
            variant="outline"
            onClick={() => onFulfill?.(ticket.id)}
            className="w-full"
          >
            Mark as Given
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    screen: '🎮',
    experience: '🎉',
    item: '🎁',
    savings: '💰',
    autonomy: '👑',
  };
  return icons[category] || '🎫';
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
```

### 3.2 아이의 티켓 페이지

**파일**: `app/[locale]/(child)/tickets/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TicketCard } from '@/components/tickets/TicketCard';
import { useChildSession } from '@/lib/stores/childSession';
import { toast } from 'sonner';

export default function ChildTicketsPage() {
  const { session } = useChildSession();
  const queryClient = useQueryClient();
  
  // 티켓 목록 조회
  const { data: tickets, isLoading } = useQuery({
    queryKey: ['child-tickets', session?.childId],
    queryFn: async () => {
      const res = await fetch(`/api/children/${session?.childId}/tickets`);
      return res.json();
    },
    enabled: !!session?.childId,
  });
  
  // 사용 요청 mutation
  const requestUseMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const res = await fetch(`/api/tickets/${ticketId}/request-use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: session?.childId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['child-tickets'] });
      toast.success('Request sent to parent!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  // 이미 pending 상태인 티켓이 있는지 확인 (가드레일)
  const hasPendingRequest = tickets?.use_requested?.length > 0;
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-2">My Tickets</h1>
      <p className="text-muted-foreground mb-6">Your purchased rewards are here!</p>
      
      <Tabs defaultValue="active">
        <TabsList className="mb-4">
          <TabsTrigger value="active">
            Active ({tickets?.active?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="waiting">
            Waiting ({tickets?.use_requested?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="used">
            Used ({tickets?.used?.length || 0})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          {tickets?.active?.length === 0 ? (
            <EmptyState message="No active tickets. Buy something from the store!" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {tickets?.active?.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  viewMode="child"
                  onRequestUse={(id) => requestUseMutation.mutate(id)}
                  hasPendingRequest={hasPendingRequest}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="waiting">
          {tickets?.use_requested?.length === 0 ? (
            <EmptyState message="No pending requests" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {tickets?.use_requested?.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  viewMode="child"
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="used">
          {tickets?.used?.length === 0 ? (
            <EmptyState message="No used tickets yet" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {tickets?.used?.slice(0, 10).map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  viewMode="child"
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      {message}
    </div>
  );
}
```

### 3.3 부모 대시보드 - 티켓 승인 섹션

**파일**: `components/dashboard/PendingTicketsSection.tsx`

```typescript
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TicketCard } from '@/components/tickets/TicketCard';
import { toast } from 'sonner';

interface PendingTicketsSectionProps {
  pendingTickets: any[];
  activeTickets: any[]; // 지급 가능한 비스크린 티켓
}

export function PendingTicketsSection({ 
  pendingTickets, 
  activeTickets 
}: PendingTicketsSectionProps) {
  const queryClient = useQueryClient();
  
  // 승인 mutation
  const approveMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const res = await fetch(`/api/tickets/${ticketId}/approve`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-tickets'] });
      toast.success('Approved! Have fun!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  // 지급 완료 mutation
  const fulfillMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const res = await fetch(`/api/tickets/${ticketId}/fulfill`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-tickets'] });
      toast.success('Marked as given!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  const hasItems = pendingTickets.length > 0 || activeTickets.length > 0;
  
  if (!hasItems) {
    return null;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎫 Tickets to Handle
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 사용 요청 대기 */}
        {pendingTickets.length > 0 && (
          <div>
            <h3 className="font-medium mb-3 text-yellow-700">
              🔔 Use Requests ({pendingTickets.length})
            </h3>
            <div className="grid gap-3">
              {pendingTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  viewMode="parent"
                  onApprove={(id) => approveMutation.mutate(id)}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* 지급 가능한 티켓 */}
        {activeTickets.length > 0 && (
          <div>
            <h3 className="font-medium mb-3 text-blue-700">
              📦 Ready to Give ({activeTickets.length})
            </h3>
            <div className="grid gap-3">
              {activeTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  viewMode="parent"
                  onFulfill={(id) => fulfillMutation.mutate(id)}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## ✅ 4. TODO Checklist

### Database
- [ ] `0XX_ticket_redemption_system.sql` 마이그레이션 작성
- [ ] `used_at` 컬럼 추가
- [ ] 기존 status 값 마이그레이션 (`purchased` → `active`, `fulfilled` → `used`)
- [ ] `request_ticket_use` 함수 생성
- [ ] `approve_ticket_use` 함수 생성
- [ ] `fulfill_ticket` 함수 생성
- [ ] `purchase_reward` 함수 업데이트 (즉시 완료 로직)

### API
- [ ] `POST /api/tickets/[id]/request-use` - 아이 사용 요청
- [ ] `POST /api/tickets/[id]/approve` - 부모 승인
- [ ] `POST /api/tickets/[id]/fulfill` - 부모 지급 완료
- [ ] `GET /api/children/[id]/tickets` - 아이 티켓 목록

### UI
- [ ] `TicketCard` 컴포넌트 (상태별 버튼 분기)
- [ ] 아이 티켓 페이지 (탭: Active/Waiting/Used)
- [ ] 부모 대시보드 - 티켓 승인 섹션
- [ ] 가드레일 UI (pending 있으면 Use 버튼 비활성화)

### TypeScript Types
- [ ] `TicketStatus` 타입 업데이트
- [ ] `TicketWithReward` 타입 정의

---

## 🧪 5. 검증 체크리스트

### 구매 플로우
- [ ] savings 카테고리 리워드 구매 시 즉시 `used` 상태가 되는가
- [ ] autonomy 카테고리 리워드 구매 시 즉시 `used` 상태가 되는가
- [ ] screen 카테고리 리워드 구매 시 `active` 상태가 되는가
- [ ] experience/item 카테고리 리워드 구매 시 `active` 상태가 되는가

### 사용 요청 플로우 (스크린)
- [ ] 아이가 스크린 티켓에서 "Use Now" 버튼이 보이는가
- [ ] 버튼 클릭 시 `use_requested` 상태로 변경되는가
- [ ] 이미 pending 티켓이 있으면 다른 티켓의 "Use Now" 버튼이 비활성화되는가
- [ ] 부모에게 알림이 가는가 (future: push notification)

### 부모 승인 플로우
- [ ] 부모 대시보드에 use_requested 티켓이 표시되는가
- [ ] "Approve" 클릭 시 `used` 상태로 변경되는가
- [ ] 아이 화면에서 상태가 업데이트되는가

### 부모 지급 플로우 (비스크린)
- [ ] 부모 대시보드에 active 비스크린 티켓이 표시되는가
- [ ] "Mark as Given" 클릭 시 `used` 상태로 변경되는가

### 가드레일
- [ ] 스크린이 아닌 티켓에 "Use Now" 버튼이 없는가
- [ ] 스크린 티켓을 fulfill_ticket으로 처리 시 에러가 나는가
- [ ] 다른 가족의 티켓 승인 시 에러가 나는가

---

## ⚠️ 주의사항

1. **기존 데이터 마이그레이션**: `purchased` → `active`, `fulfilled` → `used` 매핑 필수
2. **카테고리 하드코딩**: 새 필드 없이 기존 `category`와 `is_screen_reward`로 분기
3. **가드레일**: 동시 `use_requested` 1개 제한 (DB 함수에서 체크)
4. **권한 분리**: 아이는 request만, 부모만 approve/fulfill 가능

---

## 📁 파일 변경 요약

```
신규 파일:
├── supabase/migrations/0XX_ticket_redemption_system.sql
├── app/api/tickets/[id]/request-use/route.ts
├── app/api/tickets/[id]/approve/route.ts
├── app/api/tickets/[id]/fulfill/route.ts
├── app/api/children/[id]/tickets/route.ts
├── components/tickets/TicketCard.tsx
├── components/dashboard/PendingTicketsSection.tsx
└── app/[locale]/(child)/tickets/page.tsx (수정 또는 신규)

수정 파일:
├── types/database.ts (TicketStatus 타입)
└── app/[locale]/(app)/dashboard/page.tsx (PendingTicketsSection 추가)
```