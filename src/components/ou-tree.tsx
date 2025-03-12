"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Folder } from "lucide-react";
import { cn } from "@/lib/utils";

type OUNode = {
  id: string;
  name: string;
  path: string;
  children: OUNode[];
  accounts: {
    id: string;
    name: string;
  }[];
};

type OUTreeProps = {
  data: OUNode[];
  onSelectOU?: (ouId: string, ouPath: string) => void;
  onSelectAccount?: (accountId: string) => void;
  selectedOUId?: string;
  selectedAccountId?: string;
};

export function OUTree({
  data,
  onSelectOU,
  onSelectAccount,
  selectedOUId,
  selectedAccountId,
}: OUTreeProps) {
  const [expandedOUs, setExpandedOUs] = useState<Record<string, boolean>>({});

  const toggleOU = (ouId: string) => {
    setExpandedOUs((prev) => ({
      ...prev,
      [ouId]: !prev[ouId],
    }));
  };

  const renderOUNode = (node: OUNode) => {
    const isExpanded = expandedOUs[node.id];
    const isSelected = node.id === selectedOUId;

    return (
      <li key={node.id} className="py-1">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => toggleOU(node.id)}
            className="mr-1 p-1 hover:bg-muted rounded-sm"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onSelectOU?.(node.id, node.path)}
            className={cn(
              "flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted w-full text-left",
              isSelected && "bg-muted font-medium",
            )}
          >
            <Folder className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{node.name}</span>
            <span className="text-xs text-muted-foreground ml-auto">
              {node.accounts.length}
            </span>
          </button>
        </div>

        {isExpanded && (
          <>
            {node.accounts.length > 0 && (
              <ul className="pl-6 mt-1 space-y-1">
                {node.accounts.map((account) => (
                  <li key={account.id}>
                    <button
                      type="button"
                      onClick={() => onSelectAccount?.(account.id)}
                      className={cn(
                        "w-full text-left px-2 py-1 rounded-md hover:bg-muted text-sm",
                        selectedAccountId === account.id &&
                          "bg-muted font-medium",
                      )}
                    >
                      {account.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {node.children.length > 0 && (
              <ul className="pl-6 mt-1">
                {node.children.map((child) => renderOUNode(child))}
              </ul>
            )}
          </>
        )}
      </li>
    );
  };

  return (
    <ul className="space-y-1">{data.map((node) => renderOUNode(node))}</ul>
  );
}
