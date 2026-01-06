'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function QuickActions() {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              // TODO: Navigate to tasks page in Phase 3
              alert('Tasks page coming in Phase 3');
            }}
          >
            <span className="mr-2">📋</span> Manage Tasks
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              // TODO: Navigate to rewards page in Phase 3
              alert('Rewards page coming in Phase 3');
            }}
          >
            <span className="mr-2">🎁</span> Manage Rewards
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              // TODO: Navigate to children page in Phase 3
              alert('Children management coming in Phase 3');
            }}
          >
            <span className="mr-2">👨‍👩‍👧‍👦</span> Manage Children
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              // TODO: Navigate to settings page in Phase 3
              alert('Settings page coming in Phase 3');
            }}
          >
            <span className="mr-2">⚙️</span> Family Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
