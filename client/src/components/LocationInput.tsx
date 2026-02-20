import { useState } from 'react';
import { Autocomplete } from '@react-google-maps/api';

interface LocationInputProps {
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    onPlaceSelected?: (place: google.maps.places.PlaceResult) => void;
    className?: string;
    icon?: React.ReactNode;
}

export default function LocationInput({ placeholder, value, onChange, onPlaceSelected, className, icon }: LocationInputProps) {
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

    const onLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
        setAutocomplete(autocompleteInstance);
    };

    const onPlaceChanged = () => {
        if (autocomplete !== null) {
            const place = autocomplete.getPlace();
            if (place) {
                // If a user selects a place from the dropdown
                onChange(place.formatted_address || place.name || "");
                if (onPlaceSelected) {
                    onPlaceSelected(place);
                }
            }
        }
    };

    // If google is not available (script not loaded), fallback to normal input
    if (typeof google === 'undefined') {
        return (
            <div className={`flex items-center border rounded-lg px-3 py-2 bg-gray-50 ${className || ''}`}>
                {icon}
                <input
                    type="text"
                    placeholder={placeholder}
                    className="bg-transparent w-full outline-none ml-2"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
        );
    }

    return (
        <div className={`flex items-center border rounded-lg px-3 py-2 bg-gray-50 ${className || ''}`}>
            {icon}
            <Autocomplete
                onLoad={onLoad}
                onPlaceChanged={onPlaceChanged}
                className="w-full" // Ensure the autocomplete wrapper takes full width if needed, though mostly it wraps the child
            >
                <input
                    type="text"
                    placeholder={placeholder}
                    className="bg-transparent w-full outline-none ml-2"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            </Autocomplete>
        </div>
    );
}
