import React, { useEffect, useRef, useState } from 'react';
import api from '../../context/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';

export default function ListingCorrectionDialog({ property, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    title: property.title || '', description: property.description || '', price: property.price ?? '',
    contactNumber: property.contact_number || '', address: property.address || '',
    city: property.city || '', district: property.district || '',
    bedrooms: property.bedrooms ?? '', bathrooms: property.bathrooms ?? '',
    houseSize: property.house_size ?? '', landSize: property.land_size ?? '',
    pricePeriod: property.price_period || 'Month',
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const isLand = property.type === 'Land';
  const isRental = ['Rent House', 'Rent Villa'].includes(property.type);
  const fields = [
    { name: 'title', label: 'Property title', required: true, minLength: 3 },
    { name: 'price', label: 'Asking price (LKR)', type: 'number', min: '0.01', step: 'any', required: true },
    { name: 'contactNumber', label: 'Contact number', type: 'tel', required: true, pattern: '(0[0-9]{9}|\\+94[0-9]{9})', title: 'Use 0771234567 or +94771234567' },
    { name: 'district', label: 'District', required: true },
    { name: 'city', label: 'Town / City', required: true },
    { name: 'address', label: 'Full address', minLength: 5 },
    ...(!isLand ? [
      { name: 'bedrooms', label: 'Bedrooms', type: 'number', min: 0, step: 1 },
      { name: 'bathrooms', label: 'Bathrooms', type: 'number', min: 0, step: 1 },
      { name: 'houseSize', label: 'House size (sqft)', type: 'number', min: '0.01', step: 'any' },
    ] : []),
    ...(['House', 'Land'].includes(property.type) ? [{ name: 'landSize', label: 'Land size (perches)', type: 'number', min: 0, step: 'any' }] : []),
  ];
  const change = event => {
    setForm(previous => ({ ...previous, [event.target.name]: event.target.value }));
    setError('');
  };
  const submit = async event => {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true; setSaving(true); setError('');
    const body = { ...form };
    if (!isRental) delete body.pricePeriod;
    if (isLand) { delete body.bedrooms; delete body.bathrooms; delete body.houseSize; }
    if (!['House', 'Land'].includes(property.type)) delete body.landSize;
    try {
      const { data } = await api.patch(`/properties/my-listings/${property.id}`, body);
      if (!data?.property || data.property.id !== property.id) throw new Error('Invalid save response');
      if (active.current) onSaved(data.property);
    } catch (failure) {
      if (active.current) {
        const details = failure.response?.data;
        setError(details?.errors?.map(issue => issue.message).join(' ') || details?.message || 'Could not save your corrections. Please try again.');
      }
    } finally {
      busy.current = false;
      if (active.current) setSaving(false);
    }
  };
  return (
    <Dialog open onOpenChange={open => { if (!open && !busy.current) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto" showCloseButton={!saving}>
        <DialogHeader>
          <DialogTitle>Edit & Resubmit</DialogTitle>
          <DialogDescription>Correct your listing and send it for Admin review. Your listing fee is already paid.</DialogDescription>
        </DialogHeader>
        {property.rejection_reason && <p className="text-sm text-destructive whitespace-pre-wrap break-words">{property.rejection_reason}</p>}
        <form onSubmit={submit} className="flex flex-col gap-4">
          <fieldset disabled={saving} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <legend className="sr-only">Listing corrections</legend>
            {fields.map(({ name, label, ...attributes }) => (
              <label key={name} className="flex flex-col gap-1 text-sm">
                <span>{label}</span>
                <input {...attributes} name={name} value={form[name]} onChange={change} className="rounded-lg border border-input bg-background p-2 text-foreground" />
              </label>
            ))}
            {isRental && (
              <label className="flex flex-col gap-1 text-sm">
                <span>Rental period</span>
                <select name="pricePeriod" value={form.pricePeriod} onChange={change} className="rounded-lg border border-input bg-background p-2 text-foreground">
                  <option value="Month">Month</option>
                  <option value="Year">Year</option>
                </select>
              </label>
            )}
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span>Description</span>
              <textarea name="description" value={form.description} onChange={change} required minLength={10} rows={5} className="rounded-lg border border-input bg-background p-2 text-foreground" />
            </label>
          </fieldset>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save & Resubmit'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
