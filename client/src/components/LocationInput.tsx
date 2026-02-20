import { useRef, useEffect } from 'react';

interface LocationInputProps {
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    onPlaceSelected?: (place: google.maps.places.PlaceResult) => void;
    className?: string;
    icon?: React.ReactNode;
}

export default function LocationInput({ placeholder, value, onChange, onPlaceSelected, className, icon }: LocationInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    useEffect(() => {
        if (!inputRef.current || typeof window.google === 'undefined' || !window.google.maps.places) return;

        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
            fields: ["formatted_address", "geometry", "name"],
        });

        autocompleteRef.current.addListener("place_changed", () => {
            const place = autocompleteRef.current?.getPlace();
            if (place) {
                onChange(place.formatted_address || place.name || "");
                if (onPlaceSelected) {
                    onPlaceSelected(place);
                }
            }
        });

        // Cleanup listener on unmount
        return () => {
            if (autocompleteRef.current) {
                google.maps.event.clearInstanceListeners(autocompleteRef.current);
            }
        };
    }, [onChange, onPlaceSelected]);

    return (
        <div className={`flex items-center border rounded-lg px-3 py-2 bg-gray-50 ${className || ''}`}>
            {icon}
            <input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                className="bg-transparent w-full outline-none ml-2"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}
