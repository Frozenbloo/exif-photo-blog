import AdminInfoPage from '@/admin/AdminInfoPage';
import AdminDesignClient from '@/design/AdminDesignClient';
import { getDesignCached } from '@/design/cache';

export default async function AdminDesignPage() {
  const design = await getDesignCached();
  return (
    <AdminInfoPage>
      <AdminDesignClient currentDesign={design} />
    </AdminInfoPage>
  );
}
