import { Car, Clock, IndianRupee, MapPin, User } from "lucide-react";

interface Ride {
    _id: string;
    driverName: string;
    vehicleType: string;
    from: string;
    to: string;
    departureTime: string;
    availableSeats: number;
    costPerSeat: number;
    womenOnly: boolean;
    safetyScore?: number; // Optional if we want to add later
}

interface RideListProps {
    rides: Ride[];
    onJoin: (rideId: string) => void;
}

export default function RideList({ rides, onJoin }: RideListProps) {
    if (rides.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <Car className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>No pool rides found matching your criteria.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rides.map(ride => (
                <div key={ride._id} className={`p-4 rounded-xl shadow-sm border hover:shadow-md transition ${ride.womenOnly ? 'bg-pink-50/90 border-pink-200 dark:bg-pink-900/20 dark:border-pink-800' : 'bg-[#CCFFFF]/90 border-transparent dark:bg-gray-800 dark:border-gray-700'}`}>
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${ride.womenOnly ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800">{ride.driverName}</h4>
                                <div className="text-xs text-gray-500 capitalize flex items-center gap-1">
                                    {ride.vehicleType} • <span className="text-green-600 font-medium">Verified</span>
                                    {ride.womenOnly && <span className="text-pink-600 font-bold ml-1 text-[10px] border border-pink-200 px-1 rounded bg-pink-50">WOMEN ONLY</span>}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-lg text-gray-800 flex items-center justify-end">
                                <IndianRupee className="w-4 h-4" /> {ride.costPerSeat}
                            </div>
                            <div className="text-xs text-gray-500">per seat</div>
                        </div>
                    </div>

                    <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="truncate">{ride.from} ➝ {ride.to}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                            <Clock className="w-4 h-4 text-gray-400 mr-2" />
                            <span>{new Date(ride.departureTime).toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                        <div className="text-sm font-medium text-gray-600">
                            {ride.availableSeats} seats left
                        </div>
                        <button
                            onClick={() => onJoin(ride._id)}
                            className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition ${ride.womenOnly ? 'bg-pink-600 hover:bg-pink-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            Join Ride
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
