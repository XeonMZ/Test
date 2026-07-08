import { AppCard, PageHeader } from '@/shared/ui/components';

export default function ForbiddenPage() {
  return <AppCard><PageHeader title="Forbidden" description="Your current role does not have permission to access this page." /></AppCard>;
}
