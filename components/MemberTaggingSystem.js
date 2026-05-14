'use client'
import { useState } from 'react'
import Select from 'react-select'

export default function MemberTaggingSystem({ members, selectedParticipants, onParticipantsChange }) {
  const [selectedMember, setSelectedMember] = useState(null)
  const [awardTitle, setAwardTitle] = useState('')

  const memberOptions = members.map(member => ({
    value: member.memberId,
    label: `${member.name} (${member.memberId}) - ${member.currentRole}`,
    member: member
  }))

  const awardOptions = [
    'Coordinator',
    'Leo of the Month',
    'Volunteer of the Year',
    'Best Organizer',
    'Outstanding Service',
    'Leadership Award',
    'Community Hero',
    'Event Manager',
    'Public Relations Lead',
    'Project Lead'
  ]

  const handleAddParticipant = () => {
    if (!selectedMember) {
      alert('Please select a member')
      return
    }

    const existingParticipant = selectedParticipants.find(p => p.memberId === selectedMember.value)
    if (existingParticipant) {
      alert('Member already added!')
      return
    }

const newParticipant = {
  memberId: selectedMember.value,
  memberName: selectedMember.label.split(' (')[0], // Extract name from label
  awardTitle: awardTitle || 'Participant'
}

    onParticipantsChange([...selectedParticipants, newParticipant])
    setSelectedMember(null)
    setAwardTitle('')
  }

  const handleRemoveParticipant = (memberIdToRemove) => {
    onParticipantsChange(selectedParticipants.filter(p => p.memberId !== memberIdToRemove))
  }

  const handleUpdateAwardTitle = (memberId, newTitle) => {
    onParticipantsChange(
      selectedParticipants.map(p =>
        p.memberId === memberId ? { ...p, awardTitle: newTitle } : p
      )
    )
  }

  return (
    <div className="space-y-4">
      {/* Member Selection Area */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="label">Search Member</label>
          <Select
            options={memberOptions}
            value={selectedMember}
            onChange={setSelectedMember}
            placeholder="Type to search members..."
            isClearable
            className="react-select"
            classNamePrefix="select"
          />
        </div>
        <div>
          <label className="label">Award/Recognition Title</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={awardTitle}
              onChange={(e) => setAwardTitle(e.target.value)}
              className="input-field flex-1"
              placeholder="e.g., Coordinator, Leo of the Month"
              list="awardOptions"
            />
            <datalist id="awardOptions">
              {awardOptions.map(option => (
                <option key={option} value={option} />
              ))}
            </datalist>
            <button
              onClick={handleAddParticipant}
              className="bg-secondary text-primary px-4 py-2 rounded-lg hover:bg-opacity-90 font-medium"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Tagged Members List */}
      {selectedParticipants.length > 0 && (
        <div>
          <label className="label mb-2">Tagged Members ({selectedParticipants.length})</label>
          <div className="space-y-2 max-h-64 overflow-y-auto border border-medical-border rounded-lg p-3 bg-gray-50">
            {selectedParticipants.map((participant) => (
              <div key={participant.memberId} className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-primary">{participant.memberName}</div>
                    <div className="text-xs text-gray-500 font-mono">{participant.memberId}</div>
                  </div>
                  <button
                    onClick={() => handleRemoveParticipant(participant.memberId)}
                    className="text-red-500 hover:text-red-700 ml-2"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-2">
                  <label className="text-xs text-gray-600 block mb-1">Award Title</label>
                  <input
                    type="text"
                    value={participant.awardTitle}
                    onChange={(e) => handleUpdateAwardTitle(participant.memberId, e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Enter award/role title"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
        <strong>Summary:</strong> {selectedParticipants.length} member(s) will receive recognition for this activity.
        Each will appear in their Live CV timeline.
      </div>

      {/* Custom Styles for React-Select */}
      <style jsx>{`
        :global(.react-select__control) {
          border-color: #E2E8F0;
          border-radius: 0.5rem;
          min-height: 42px;
        }
        :global(.react-select__control:hover) {
          border-color: #D4AF37;
        }
        :global(.react-select__control--is-focused) {
          border-color: #002147;
          box-shadow: 0 0 0 1px #002147;
        }
        :global(.react-select__option--is-selected) {
          background-color: #002147;
        }
        :global(.react-select__option--is-focused) {
          background-color: #D4AF37;
          color: #002147;
        }
        :global(.react-select__multi-value) {
          background-color: #D4AF37;
        }
      `}</style>
    </div>
  )
}
