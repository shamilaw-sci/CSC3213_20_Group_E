import React, { useEffect, useRef, useState } from 'react';
import api from '../../context/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';

export default function DeleteListingDialog({ property, onClose, onRemoved }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);

  const remove = async () => {
    if (busy.current || !active.current) return;
    busy.current = true;
    setSaving(true);
    setError('');
    try {
      await api.delete(`/properties/my-listings/${property.id}`);
      if (active.current) onRemoved();
    } catch {
      if (active.current) setError('Could not remove this listing. Please try again.');
    } finally {
      busy.current = false;
      if (active.current) setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={open => { if (!open && !busy.current) onClose(); }}>
      <DialogContent showCloseButton={!saving} aria-busy={saving}>
        <DialogHeader>
          <DialogTitle>Remove listing?</DialogTitle>
          <DialogDescription>Remove this listing from your listings and public search? Payment and conversation history will be retained.</DialogDescription>
        </DialogHeader>
        <p className="font-medium break-words">{property.title}</p>
        {error && <p role="alert" className="text-destructive">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button type="button" variant="destructive" disabled={saving} onClick={remove}>{saving ? 'Removing...' : 'Remove listing'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
