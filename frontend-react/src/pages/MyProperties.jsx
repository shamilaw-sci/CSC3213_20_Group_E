import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/UserAuthContext';

const STATUS_STYLES = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
};

const STATUS_LABELS = {
    pending: 'Pending Approval',
    approved: 'Approved',
    rejected: 'Needs Changes',
};

const EditPropertyModal = ({ property, onCancel, onSaved }) => {
    const [formData, setFormData] = useState({
        type: property.type || 'House',
        title: property.title || '',
        description: property.description || '',
        price: property.price || '',
        address: property.address || '',
        bedrooms: property.bedrooms || '',
        bathrooms: property.bathrooms || '',
        landSize: property.land_size || '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (event) => {
        setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');

        try {
            const response = await axios.patch(
                `http://localhost:5000/api/properties/my-listings/${property.id}`,
                formData,
                { withCredentials: true }
            );
            onSaved(response.data.property);
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Failed to update property.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-extrabold text-gray-900">Edit Property</h2>
                        <p className="text-sm text-gray-500">Saving changes will send this back to admin review.</p>
                    </div>
                    <button type="button" onClick={onCancel} className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-100">
                        Close
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                    {error && <div className="md:col-span-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm font-medium">{error}</div>}

                    <div className="md:col-span-2">
                        <label htmlFor="a11y" className="block text-sm font-bold text-gray-700 mb-2">Property Type</label>
                        <select name="type" value={formData.type} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500">
                            <option value="House">House</option>
                            <option value="Land">Land</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label htmlFor="rapvbi" className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                        <input aria-label="Accessible interactive control" name="title" value={formData.title} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
                    </div>

                    <div>
                        <label htmlFor="sb7h5e" className aria-label="Accessible interactive control"="block text-sm font-bold text-gray-700 mb-2">Price (Rs.)</label>
                        <input aria-label="Accessible interactive control" type="number" name="price" value={formData.price} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg htmlFor="4if859" focus:outline-none focus:border-blue-500" />
                    </div>

                    <div>
                        <label htmlFor="ac6gom" className="block text-sm font-bold text-gray-700 mb-2">Land Size (Perches)</label>
                        <input aria-label="Accessible interactive control" type="number" name="landSize" value={formData.landSize} onChange={handleChange} className="w-full htmlFor="6xfyqu" px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
                    </div>

                    <div className="md:col-span-2">
                        <label htmlFor="88c0s2" className="block text-sm font-bold text-gray-700 mb-2">Address</label>
                        <input aria-label="Accessible interactive control" name="address" value={formData.address} onChange={handleChange} required className="w-full px-4 py-3 htmlFor="p52g1q" border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
                    </div>

                    {formData.type !== 'Land' && (
                        <>
                            <div>
                                <label htmlFor="7x815n" className="block text-sm font-bold text-gray-700 mb-2">Bedrooms</label>
                                <input aria-label="Accessible htmlFor="4nuq8u" interactive control" type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} className aria-label="Accessible interactive control"="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
                            </div>

                            <div>
                                <label htmlFor="3ssl0e" className="block text-sm font-bold text-gray-700 mb-2">Bathrooms</label>
                                <input aria-label="Accessible htmlFor="zx9yga" interactive control" type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} className aria-label="Accessible interactive control"="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
                            </div>
                        </>
                    )}

                    <div className="md:col-span-2">
                        <label htmlFor="2k4rsd" className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                        <textarea aria-label="Accessible interactive control" name="description" value={formData.description} onChange={handleChange} rows={5} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
                    </div>
                </div>

                <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                    <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-100">
                        Cancel
                    </button>
                    <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:bg-blue-300">
                        {saving ? 'Sending...' : 'Save & Send to Review'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const MyProperties = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editTarget, setEditTarget] = useState(null);
    const [notice, setNotice] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        if (!user || user.role !== 'SELLER') {
            navigate('/login');
            return;
        }

        const fetchMyProperties = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/properties/my-listings?page=${page}&limit=12`, {
                    withCredentials: true
                });
                if (page === 1) {
                    setProperties(response.data.properties || []);
                } else {
                    setProperties(prev => [...prev, ...(response.data.properties || [])]);
                }
                setTotalPages(response.data.totalPages || 1);
            } catch (err) {
                setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load your properties.');
            } finally {
                setLoading(false);
            }
        };

        fetchMyProperties();
    }, [navigate, user, page]);

    const counts = useMemo(() => {
        return properties.reduce(
            (acc, property) => {
                const status = property.status || 'pending';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            },
            { pending: 0, approved: 0, rejected: 0 }
        );
    }, [properties]);

    const handleSaved = (updatedProperty) => {
        setProperties((prev) => prev.map((property) => (property.id === updatedProperty.id ? updatedProperty : property)));
        setEditTarget(null);
        setNotice('Updated and sent to admin review.');
        setTimeout(() => setNotice(''), 3000);
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">Pending Approvals</h1>
                        <p className="text-gray-500 mt-1">Track properties you submitted for admin review.</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 min-w-[320px]">
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                            <p className="text-xs text-gray-500 font-bold uppercase">Pending</p>
                            <p className="text-2xl font-extrabold text-amber-600">{counts.pending}</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                            <p className="text-xs text-gray-500 font-bold uppercase">Approved</p>
                            <p className="text-2xl font-extrabold text-green-600">{counts.approved}</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                            <p className="text-xs text-gray-500 font-bold uppercase">Changes</p>
                            <p className="text-2xl font-extrabold text-red-600">{counts.rejected}</p>
                        </div>
                    </div>
                </div>

                {loading && <div className="bg-white border border-gray-200 rounded-lg p-8 text-gray-500">Loading your submissions...</div>}
                {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 font-medium">{error}</div>}
                {notice && <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 font-medium mb-6">{notice}</div>}

                {!loading && !error && properties.length === 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No submitted properties yet</h2>
                        <p className="text-gray-500 mb-5">Publish a property and it will appear here while admins review it.</p>
                        <button onClick={() => navigate('/add-property')} className="px-5 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700">
                            Add Property
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map((property) => {
                        const status = property.status || 'pending';
                        const image = Array.isArray(property.images) ? property.images[0] : null;
                        return (
                            <article key={property.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                <div className="h-48 bg-gray-100">
                                    {image ? (
                                        <img src={image} alt={property.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <h2 className="font-extrabold text-lg text-gray-900 leading-tight">{property.title}</h2>
                                        <span className={`text-xs font-bold border rounded-full px-2.5 py-1 whitespace-nowrap ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
                                            {STATUS_LABELS[status] || status}
                                        </span>
                                    </div>
                                    <p className="text-xl font-extrabold text-blue-600 mb-1">Rs. {Number(property.price || 0).toLocaleString()}</p>
                                    <p className="text-sm text-gray-600 mb-3">{property.address}</p>
                                    {status === 'pending' && (
                                        <p className="text-sm bg-amber-50 text-amber-800 border border-amber-100 rounded-lg p-3">
                                            Sent to admin review. This property is hidden from public web and map search.
                                        </p>
                                    )}
                                    {status === 'rejected' && (
                                        <div className="text-sm bg-red-50 text-red-800 border border-red-100 rounded-lg p-3">
                                            <p className="font-bold mb-1">Admin suggestion</p>
                                            <p>{property.rejection_reason || 'Please update the details and submit again.'}</p>
                                        </div>
                                    )}
                                    {status !== 'approved' && (
                                        <button
                                            onClick={() => setEditTarget(property)}
                                            className="mt-4 w-full px-4 py-2.5 rounded-lg border border-blue-600 text-blue-600 font-bold hover:bg-blue-50"
                                        >
                                            Edit & Resubmit
                                        </button>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>

                {/* Load More Button */}
                {page < totalPages && properties.length > 0 && (
                    <div className="text-center mt-12 mb-8">
                        <button 
                            onClick={() => setPage(prev => prev + 1)}
                            className="bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 font-bold py-3 px-8 rounded-lg transition duration-300"
                        >
                            Load More Properties
                        </button>
                    </div>
                )}
            </main>

            {editTarget && (
                <EditPropertyModal
                    property={editTarget}
                    onCancel={() => setEditTarget(null)}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
};

export default MyProperties;
