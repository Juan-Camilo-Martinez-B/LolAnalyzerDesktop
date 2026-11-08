import React from 'react';
import { Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ALL_PROFILES, profileLabel } from '../../services/riotProfiles';

const AUTOMATIC = '';

/**
 * Switches the dashboard between the League profiles stored on the account.
 * "Automático" follows the linked Riot ID or, without one, the open client.
 */
export const ProfileSelector: React.FC = () => {
  const { state, dispatch } = useApp();
  const { riotProfiles, activeProfile, profileChoice } = state;
  if (riotProfiles.length === 0) return null;

  const onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    dispatch({ type: 'SET_PROFILE_CHOICE', payload: value === AUTOMATIC ? null : value });
  };

  return (
    <label className="profile-selector" title="Perfil de League que muestra el dashboard">
      <Users size={13} aria-hidden="true" />
      <span className="profile-selector__label">Perfil</span>
      <select
        className="profile-selector__select"
        value={profileChoice ?? AUTOMATIC}
        onChange={onChange}
        aria-label="Perfil de League que muestra el dashboard"
      >
        <option value={AUTOMATIC}>
          Automático{profileChoice === null && activeProfile !== ALL_PROFILES
            ? ` (${profileLabel(riotProfiles.find((p) => p.puuid === activeProfile) ?? { puuid: activeProfile, gameName: null, tagLine: null })})`
            : ''}
        </option>
        {riotProfiles.map((profile) => (
          <option key={profile.puuid} value={profile.puuid}>
            {profileLabel(profile)}{profile.linked ? ' · vinculado' : ''}
          </option>
        ))}
        <option value={ALL_PROFILES}>Todos los perfiles</option>
      </select>
    </label>
  );
};
