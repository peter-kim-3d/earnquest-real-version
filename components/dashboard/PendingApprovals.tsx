'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDistanceToNow } from 'date-fns';
import { approveTask, rejectTask, deleteTaskCompletion } from '@/lib/actions/tasks';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [rejectMessage, setRejectMessage] = useState('');

  const handleApprove = async (approvalId: string, childName: string, taskName: string, points: number) => {
    setLoading(approvalId);
    const result = await approveTask(approvalId);
    setLoading(null);

    if (result.success) {
      toast({
        title: '✅ Task Approved!',
        description: `${childName} earned ${points} points for "${taskName}"`,
        duration: 5000,
      });
    } else {
      toast({
        title: '❌ Error',
        description: result.error || 'Failed to approve task',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const handleRejectClick = (approval: PendingApproval) => {
    setSelectedApproval(approval);
    setRejectMessage('');
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedApproval) return;

    setLoading(selectedApproval.id);
    const result = await rejectTask(selectedApproval.id, rejectMessage || undefined);
    setLoading(null);
    setRejectDialogOpen(false);

    if (result.success) {
      toast({
        title: '↩️ Task Needs Work',
        description: `${selectedApproval.child_name} will be notified to fix "${selectedApproval.task_name}"`,
        duration: 5000,
      });
    } else {
      toast({
        title: '❌ Error',
        description: result.error || 'Failed to reject task',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const handleDelete = async (approvalId: string, childName: string, taskName: string) => {
    if (!confirm('Are you sure you want to delete this task completion?')) {
      return;
    }

    setLoading(approvalId);
    const result = await deleteTaskCompletion(approvalId);
    setLoading(null);

    if (result.success) {
      toast({
        title: '🗑️ Task Deleted',
        description: `Removed "${taskName}" from ${childName}`,
        duration: 5000,
      });
    } else {
      toast({
        title: '❌ Error',
        description: result.error || 'Failed to delete task',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  return (
    <>
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
                    onClick={() => handleRejectClick(approval)}
                    disabled={loading === approval.id}
                    className="text-red-600 hover:bg-red-50"
                  >
                    {loading === approval.id ? '...' : '✕'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(approval.id, approval.child_name, approval.task_name, approval.points)}
                    disabled={loading === approval.id}
                    className="bg-growth-green hover:bg-growth-green/90"
                  >
                    {loading === approval.id ? '...' : '✓ Approve'}
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

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Fixes</DialogTitle>
            <DialogDescription>
              Send this task back to {selectedApproval?.child_name} with feedback on what needs to be fixed.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="message">Feedback (optional)</Label>
            <Input
              id="message"
              placeholder="e.g., Please make your bed neatly and put pillows in place"
              value={rejectMessage}
              onChange={(e) => setRejectMessage(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRejectConfirm} className="bg-orange-500 hover:bg-orange-600">
              Send Back for Fixes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
