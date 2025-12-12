import { useState, useEffect } from 'react';

const SETTINGS_KEY = 'tanaoroshi_settings';

export type DeviceMode = 'android' | 'ios' | 'pc';

export interface Settings {
    deviceMode: DeviceMode;
}

const DEFAULT_SETTINGS: Settings = {
    deviceMode: 'android',
};

export function useSettings() {
    const [settings, setSettings] = useState<Settings>(() => {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) {
            try {
                return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
            } catch (e) {
                console.error('Failed to parse settings', e);
            }
        }
        return DEFAULT_SETTINGS;
    });

    useEffect(() => {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }, [settings]);

    const setDeviceMode = (mode: DeviceMode) => {
        setSettings(prev => ({ ...prev, deviceMode: mode }));
    };

    return {
        settings,
        setDeviceMode,
    };
}
