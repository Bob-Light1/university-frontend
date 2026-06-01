import PermissionGate from '../shared/PermissionGate';
import AnnouncementAdmin from '../../../components/announcements/AnnouncementAdmin';

export default function StaffAnnouncements() {
  return (
    <PermissionGate permission="announcements">
      <AnnouncementAdmin />
    </PermissionGate>
  );
}
