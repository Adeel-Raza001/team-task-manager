import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function MembersPanel({ team, onTeamDeleted, onMembersChanged }) {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const isOwner = team.role === 'owner';

  const load = useCallback(() => {
    api
      .get(`/teams/${team.id}`)
      .then((res) => setMembers(res.data.members))
      .catch(() => setMembers([]));
  }, [team.id]);

  useEffect(() => {
    load();
    setMessage({ type: '', text: '' });
  }, [load]);

  const addMember = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    try {
      await api.post(`/teams/${team.id}/members`, { email });
      setEmail('');
      setMessage({ type: 'success', text: 'Member added' });
      load();
      onMembersChanged();
    } catch (err) {
      const data = err.response?.data;
      setMessage({ type: 'error', text: data?.errors?.join(', ') || data?.message || 'Could not add member' });
    }
  };

  const removeMember = async (member) => {
    if (!window.confirm(`Remove ${member.name} from this team?`)) return;
    try {
      await api.delete(`/teams/${team.id}/members/${member.id}`);
      load();
      onMembersChanged();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not remove member' });
    }
  };

  const deleteTeam = async () => {
    if (!window.confirm(`Delete team "${team.name}" and all its tasks? This cannot be undone.`)) return;
    try {
      await api.delete(`/teams/${team.id}`);
      onTeamDeleted(team.id);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not delete team' });
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">{team.name} members</h2>
        {isOwner && (
          <button onClick={deleteTeam} className="text-sm font-medium text-red-600 hover:underline">
            Delete team
          </button>
        )}
      </div>

      <ul className="mt-3 divide-y divide-gray-100">
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between py-2 text-sm">
            <div>
              <span className="font-medium text-gray-800">{m.name}</span>{' '}
              <span className="text-gray-500">({m.email})</span>
              {m.role === 'owner' && (
                <span className="ml-2 rounded bg-indigo-100 px-1.5 py-0.5 text-xs text-indigo-700">owner</span>
              )}
            </div>
            {m.role !== 'owner' && (isOwner || m.id === user.id) && (
              <button onClick={() => removeMember(m)} className="text-xs text-red-600 hover:underline">
                {m.id === user.id ? 'Leave' : 'Remove'}
              </button>
            )}
          </li>
        ))}
      </ul>

      {isOwner && (
        <form onSubmit={addMember} className="mt-3 flex gap-2">
          <input
            type="email"
            placeholder="Member email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Add
          </button>
        </form>
      )}

      {message.text && (
        <p className={`mt-2 text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message.text}</p>
      )}
    </div>
  );
}