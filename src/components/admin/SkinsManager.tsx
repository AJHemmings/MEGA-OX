import React, { useState } from 'react';
import { useAdminItems, AdminItem, ItemFormData } from '../../hooks/useAdminItems';
import { ContentTable } from './shared/ContentTable';
import { ItemFormModal } from './shared/ItemFormModal';

const TABS = [
  { key: 'all',    label: 'All',    types: ['avatar','badge','banner','board','marker','theme'] },
  { key: 'avatar', label: 'Avatar', types: ['avatar'] },
  { key: 'badge',  label: 'Badge',  types: ['badge']  },
  { key: 'banner', label: 'Banner', types: ['banner'] },
  { key: 'board',  label: 'Board',  types: ['board']  },
  { key: 'marker', label: 'Marker', types: ['marker'] },
];

const TYPE_OPTIONS = ['avatar', 'badge', 'banner', 'board', 'marker', 'theme'];

const SkinsManager: React.FC = () => {
  const { items, loading, error, addItem, updateItem, archiveItem, restoreItem } =
    useAdminItems(['avatar','badge','banner','board','marker','theme']);

  const [activeTab, setActiveTab] = useState('all');
  const [modalItem, setModalItem] = useState<AdminItem | null | undefined>(undefined);

  const handleSave = async (form: ItemFormData) => {
    if (modalItem === null) return addItem(form);
    if (modalItem)          return updateItem(modalItem.id, form);
    return null;
  };

  return (
    <>
      <ContentTable
        items={items} loading={loading} error={error}
        tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}
        sectionTitle="Skins"
        onAdd={() => setModalItem(null)}
        onEdit={item => setModalItem(item)}
        onArchive={archiveItem}
        onRestore={restoreItem}
      />
      {modalItem !== undefined && (
        <ItemFormModal
          item={modalItem}
          typeOptions={TYPE_OPTIONS}
          onSave={handleSave}
          onClose={() => setModalItem(undefined)}
        />
      )}
    </>
  );
};

export default SkinsManager;
