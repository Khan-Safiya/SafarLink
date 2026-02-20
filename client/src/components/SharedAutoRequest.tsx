import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Users, MapPin } from 'lucide-react';
import api, { setupInterceptors } from '../api/axios';

export default function SharedAutoRequest({ onSuccess }: { onSuccess: () => void }) {
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        userName: '',
        from: '',
        to: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            setupInterceptors(getToken);
            await api.post('/shared-autos/request', formData);
            alert('Ride requested! Waiting for driver matching...');
            onSuccess();
        } catch (err) {
            console.error(err);
            alert('Failed to request ride.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-orange-50 border border-orange-200 p-6 rounded-xl space-y-4">
            <h3 className="text-xl font-bold text-orange-800 flex items-center gap-2">
                <Users className="text-orange-600" /> Request Shared Auto
            </h3>
            <p className="text-sm text-orange-700">We will group you with other riders going to similar destinations.</p>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                <input type="text" name="userName" value={formData.userName} onChange={handleChange} required className="w-full border rounded-lg p-2 bg-white" placeholder="e.g. Jane Doe" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                    <div className="flex items-center border rounded-lg p-2 bg-white">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                        <input type="text" name="from" value={formData.from} onChange={handleChange} required className="w-full bg-transparent outline-none" placeholder="Pickup Location" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                    <div className="flex items-center border rounded-lg p-2 bg-white">
                        <MapPin className="w-4 h-4 text-red-500 mr-2" />
                        <input type="text" name="to" value={formData.to} onChange={handleChange} required className="w-full bg-transparent outline-none" placeholder="Destination" />
                    </div>
                </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white py-2 rounded-lg font-semibold hover:bg-orange-700 transition disabled:opacity-50">
                {loading ? 'Requesting...' : 'Find Shared Auto'}
            </button>
        </form>
    );
}
