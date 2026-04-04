// src/app/(dashboard)/settings/page.tsx
// Server Component — lấy profile từ DB rồi truyền xuống Client
import { redirect } from 'next/navigation';
import { getMyProfile } from './action';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
    const profile = await getMyProfile();

    if (!profile) {
        redirect('/login');
    }

    return <SettingsClient profile={profile} />;
}
