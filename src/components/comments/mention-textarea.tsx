/**
 * Mention Textarea Component
 * Textarea with @mention autocomplete support
 */

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  email: string;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string, mentions: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  className?: string;
}

export function MentionTextarea({
  value,
  onChange,
  placeholder = "Type @ to mention someone...",
  disabled = false,
  rows = 3,
  className,
}: MentionTextareaProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await supabase.auth.admin.listUsers();
      if (data?.users) {
        setUsers(data.users.map((u) => ({ id: u.id, email: u.email || "" })));
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;

    // Check if @ was typed
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf("@");

    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1);
      
      // Check if we're in a mention (no spaces after @)
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setMentionSearch(textAfterAt.toLowerCase());
        setShowMentions(true);
        setSelectedIndex(0);

        // Calculate position for dropdown
        if (textareaRef.current) {
          const textarea = textareaRef.current;
          const rect = textarea.getBoundingClientRect();
          setMentionPosition({
            top: rect.top - 200, // Position above textarea
            left: rect.left,
          });
        }
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }

    // Extract mentions (user IDs) from text
    const mentions = extractMentions(newValue, users);
    onChange(newValue, mentions);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentions) return;

    const filteredUsers = filterUsers();

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredUsers.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (filteredUsers[selectedIndex]) {
        selectUser(filteredUsers[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setShowMentions(false);
    }
  };

  const filterUsers = () => {
    if (!mentionSearch) return users;
    return users.filter((u) =>
      u.email.toLowerCase().includes(mentionSearch.toLowerCase())
    );
  };

  const selectUser = (user: User) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf("@");

    const textBefore = value.substring(0, lastAtSymbol);
    const textAfter = value.substring(cursorPosition);

    const newValue = `${textBefore}@${user.email} ${textAfter}`;
    const newCursorPos = lastAtSymbol + user.email.length + 2;

    // Extract mentions
    const mentions = extractMentions(newValue, users);
    onChange(newValue, mentions);

    setShowMentions(false);

    // Set cursor position after mention
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const extractMentions = (text: string, userList: User[]): string[] => {
    const mentionRegex = /@([^\s@]+@[^\s@]+\.[^\s@]+)/g;
    const matches = text.match(mentionRegex) || [];
    
    const mentionedEmails = matches.map((m) => m.substring(1)); // Remove @
    const mentionedUserIds = userList
      .filter((u) => mentionedEmails.includes(u.email))
      .map((u) => u.id);

    return mentionedUserIds;
  };

  const filteredUsers = filterUsers();

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={cn("resize-none", className)}
      />

      {/* Mention Dropdown */}
      {showMentions && filteredUsers.length > 0 && (
        <div
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md"
          style={{ bottom: "100%", marginBottom: "4px" }}
        >
          {filteredUsers.slice(0, 5).map((user, index) => (
            <button
              key={user.id}
              type="button"
              onClick={() => selectUser(user)}
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm transition-colors",
                index === selectedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              )}
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <span>{user.email}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
