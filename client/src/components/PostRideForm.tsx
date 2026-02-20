import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Car, MapPin, Clock, Users, IndianRupee } from 'lucide-react';
import api, { setupInterceptors } from '../api/axios';

export default function PostRideForm({ onSuccess }: { onSuccess: () => void }) {
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        driverName: '', // In a real app, this would be auto-filled from profile
        vehicleType: 'car',
        from: '',
        to: '',
        departureTime: '',
        availableSeats: 3,
        costPerSeat: 50,
        womenOnly: false
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            setupInterceptors(getToken);
            await api.post('/rides', formData);
            alert('Ride posted successfully!');
            onSuccess();
        } catch (err) {
            console.error(err);
            alert('Failed to post ride.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md space-y-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Car className="text-blue-600" /> Offer a Pool Ride
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
                    <input type="text" name="driverName" value={formData.driverName} onChange={handleChange} required className="w-full border rounded-lg p-2" placeholder="e.g. John Doe" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                    <select name="vehicleType" value={formData.vehicleType} onChange={handleChange} className="w-full border rounded-lg p-2">
                        <option value="car">Car</option>
                        <option value="bike">Bike</option>
                        <option value="scooter">Scooter</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                    <div className="flex items-center border rounded-lg p-2 bg-gray-50">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                        <input type="text" name="from" value={formData.from} onChange={handleChange} required className="w-full bg-transparent outline-none" placeholder="Starting Point" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To (Metro Station)</label>
                    <div className="flex items-center border rounded-lg p-2 bg-gray-50">
                        <MapPin className="w-4 h-4 text-red-500 mr-2" />
                        <input type="text" name="to" value={formData.to} onChange={handleChange} required className="w-full bg-transparent outline-none" placeholder="Destination" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time</label>
                    <div className="flex items-center border rounded-lg p-2 bg-gray-50">
                        <Clock className="w-4 h-4 text-gray-400 mr-2" />
                        <input type="datetime-local" name="departureTime" value={formData.departureTime} onChange={handleChange} required className="w-full bg-transparent outline-none" />
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Seats</label>
                        <div className="flex items-center border rounded-lg p-2">
                            <Users className="w-4 h-4 text-gray-400 mr-2" />
                            <input type="number" name="availableSeats" min="1" max="6" value={formData.availableSeats} onChange={handleChange} required className="w-full outline-none" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cost (₹)</label>
                        <div className="flex items-center border rounded-lg p-2">
                            <IndianRupee className="w-4 h-4 text-gray-400 mr-2" />
                            <input type="number" name="costPerSeat" min="0" value={formData.costPerSeat} onChange={handleChange} required className="w-full outline-none" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <input type="checkbox" name="womenOnly" id="womenOnly" checked={formData.womenOnly} onChange={handleChange} className="w-4 h-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded" />
                <label htmlFor="womenOnly" className="text-sm text-gray-700 font-medium">Women Only Ride</label>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                {loading ? 'Posting...' : 'Post Ride'}
            </button>
        </form>
    );
}
