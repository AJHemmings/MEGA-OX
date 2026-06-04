import React, { useState } from 'react';
import { useAdminItems, AdminItem, ItemFormData } from '../../hooks/useAdminItems';
import { ContentTable } from './shared/ContentTable';
import { ItemFormModal } from './shared/ItemFormModal';

const EmojiManager: React.FC = () => {
  const { items, loading, error, addItem, updateItem, archiveItem, restoreItem } =
    useAdminItems('emoji');

  const [modalItem, setModalItem] = useState<AdminItem | null | undefined>(undefined);

  const handleSave = async (form: ItemFormData) => {
    const payload = { ...form, type: 'emoji', source: 'shop' };
    if (modalItem === null) return addItem(payload);
    if (modalItem)          return updateItem(modalItem.id, payload);
    return null;
  };

  return (
    <>
      <ContentTable
        items={items} loading={loading} error={error}
        sectionTitle="Emojis"
        onAdd={() => setModalItem(null)}
        onEdit={item => setModalItem(item)}
        onArchive={archiveItem}
        onRestore={restoreItem}
      />
      {modalItem !== undefined && (
        <ItemFormModal
          item={modalItem}
          typeOptions={['emoji']}
          onSave={handleSave}
          onClose={() => setModalItem(undefined)}
        />
      )}
    </>
  );
};

export default EmojiManager;
