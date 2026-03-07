import { X } from "lucide-react";
import type { EntraUserSearchItem } from "@/lib/portalApi";

interface NewThreadPanelProps {
  topic: string;
  onTopicChange: (value: string) => void;
  userSearchQuery: string;
  onUserSearchQueryChange: (value: string) => void;
  searchingUsers: boolean;
  userSearchResults: EntraUserSearchItem[];
  selectedUsers: EntraUserSearchItem[];
  creatingThread: boolean;
  onCancel: () => void;
  onCreate: () => void;
  onAddUser: (user: EntraUserSearchItem) => void;
  onRemoveUser: (userId: string) => void;
}

export function NewThreadPanel({
  topic,
  onTopicChange,
  userSearchQuery,
  onUserSearchQueryChange,
  searchingUsers,
  userSearchResults,
  selectedUsers,
  creatingThread,
  onCancel,
  onCreate,
  onAddUser,
  onRemoveUser,
}: NewThreadPanelProps) {
  return (
    <div className="mt-2 rounded-md border border-border bg-background p-2 space-y-2">
      <input
        value={topic}
        onChange={(e) => onTopicChange(e.target.value)}
        placeholder="Thread topic"
        className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs outline-none"
      />
      <input
        value={userSearchQuery}
        onChange={(e) => onUserSearchQueryChange(e.target.value)}
        placeholder="Search Entra users..."
        className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs outline-none"
      />
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedUsers.map((user) => (
            <span key={user.id} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px]">
              {user.displayName}
              <button type="button" onClick={() => onRemoveUser(user.id)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="max-h-32 overflow-y-auto rounded border border-border">
        {searchingUsers ? (
          <div className="px-2 py-1.5 text-[10px] text-muted-foreground">Searching...</div>
        ) : userSearchResults.length === 0 ? (
          <div className="px-2 py-1.5 text-[10px] text-muted-foreground">No users</div>
        ) : (
          userSearchResults.map((user) => (
            <button
              type="button"
              key={user.id}
              className="w-full border-b border-border px-2 py-1.5 text-left text-[10px] hover:bg-muted last:border-b-0"
              onClick={() => onAddUser(user)}
            >
              <div className="font-medium text-foreground">{user.displayName}</div>
              <div className="text-muted-foreground">{user.mail || user.userPrincipalName}</div>
            </button>
          ))
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex-1 rounded border border-border px-2 py-1 text-[10px] hover:bg-muted"
          onClick={onCancel}
          disabled={creatingThread}
        >
          Cancel
        </button>
        <button
          type="button"
          className="flex-1 rounded bg-primary px-2 py-1 text-[10px] text-primary-foreground disabled:opacity-50"
          onClick={onCreate}
          disabled={creatingThread || !topic.trim() || selectedUsers.length === 0}
        >
          {creatingThread ? "Creating..." : "Create"}
        </button>
      </div>
    </div>
  );
}
