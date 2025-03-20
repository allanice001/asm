"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, FileText, Server, User } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchResult {
  id: number;
  name: string;
  type: "account" | "permission-set" | "policy" | "user";
  description?: string;
}

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (!debouncedSearchTerm.trim() || debouncedSearchTerm.length < 2) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(debouncedSearchTerm)}`,
        );
        if (response.ok) {
          const data = await response.json();
          setResults(data);
        }
      } catch (error) {
        console.error("Error searching:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedSearchTerm]);

  const handleSelect = (result: SearchResult) => {
    let path = "/";
    switch (result.type) {
      case "account":
        path = `/accounts/${result.id}`;
        break;
      case "permission-set":
        path = `/permission-sets/${result.id}`;
        break;
      case "policy":
        path = `/policies/${result.id}`;
        break;
      case "user":
        path = `/users/${result.id}`;
        break;
    }
    router.push(path);
    onOpenChange(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "account":
        return <Server className="h-4 w-4" />;
      case "permission-set":
        return <Shield className="h-4 w-4" />;
      case "policy":
        return <FileText className="h-4 w-4" />;
      case "user":
        return <User className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Input
            placeholder="Search accounts, permission sets, policies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : results.length > 0 ? (
              results.map((result) => (
                <Button
                  key={`${result.type}-${result.id}`}
                  variant="ghost"
                  className="w-full justify-start text-left"
                  onClick={() => handleSelect(result)}
                >
                  <div className="flex items-center gap-2">
                    {getIcon(result.type)}
                    <div>
                      <div className="font-medium">{result.name}</div>
                      {result.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                          {result.description}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground capitalize">
                        {result.type.replace("-", " ")}
                      </div>
                    </div>
                  </div>
                </Button>
              ))
            ) : debouncedSearchTerm.length >= 2 ? (
              <div className="text-center py-4 text-muted-foreground">
                No results found
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
