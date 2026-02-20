import { Users, IndianRupee, Map } from "lucide-react";

interface AutoGroup {
    destination: string;
    count: number;
    riders: string[];
    requestIds: string[];
}

interface SharedAutoGroupsProps {
    groups: AutoGroup[];
    onAccept: (destination: string) => void;
}

export default function SharedAutoGroups({ groups, onAccept }: SharedAutoGroupsProps) {
    if (groups.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>No waiting passengers found.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            {groups.map((group, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 hover:shadow-md transition">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-orange-100 text-orange-600">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800">{group.count} Passengers Waiting</h4>
                                <div className="text-xs text-gray-500">Destination: <span className="font-bold text-gray-700">{group.destination}</span></div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-lg text-green-600 flex items-center justify-end">
                                <IndianRupee className="w-4 h-4" /> {group.count * 20}
                            </div>
                            <div className="text-xs text-gray-500">Est. Total Fare</div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm text-gray-600">
                        <span className="font-semibold">Riders:</span> {group.riders.map((r, i) => <span key={i}>{r}{i < group.riders.length - 1 ? ', ' : ''}</span>)}
                    </div>

                    <button
                        onClick={() => onAccept(group.destination)}
                        className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
                    >
                        <Map className="w-4 h-4" /> Accept Group & Start Ride
                    </button>
                </div>
            ))}
        </div>
    );
}
