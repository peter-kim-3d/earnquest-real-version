'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

type PendingApproval = {
  id: string;
  task_name: string;
  points: number;
  child_name: string;
  child_avatar: string | null;
  requested_at: string;
  auto_approve_at: string | null;
  fix_request_count: number;
  status: string;
};

export function PendingApprovals({ approvals }: { approvals: PendingApproval[] }) {
  const handleApprove = async (approvalId: string) => {
    // TODO: Implement approval logic in Phase 3
    console.log('Approve:', approvalId);
  };

  const handleReject = async (approvalId: string) => {
    // TODO: Implement rejection logic in Phase 3
    console.log('Reject:', approvalId);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Pending Approvals</CardTitle>
          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
            {approvals.length} pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {approvals.slice(0, 5).map((approval) => (
            <div
              key={approval.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="text-2xl">{approval.child_avatar || '👤'}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900">{approval.child_name}</p>
                    {approval.status === 'fix_requested' && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">
                        Resubmitted
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{approval.task_name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(approval.requested_at), { addSuffix: true })}
                    </span>
                    <span className="text-xs font-semibold text-star-gold">
                      {approval.points} points
                    </span>
                    {approval.auto_approve_at && (
                      <span className="text-xs text-gray-500">
                        Auto-approves{' '}
                        {formatDistanceToNow(new Date(approval.auto_approve_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject(approval.id)}
                  className="text-red-600 hover:bg-red-50"
                >
                  ✕
                </Button>
                <Button size="sm" onClick={() => handleApprove(approval.id)} className="bg-growth-green hover:bg-growth-green/90">
                  ✓ Approve
                </Button>
              </div>
            </div>
          ))}

          {approvals.length > 5 && (
            <Button variant="outline" className="w-full">
              View All {approvals.length} Approvals
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
