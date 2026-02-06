"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PostFiltersProps {
  filters: {
    sortBy: string;
  };
  onChange: (filters: any) => void;
}

export default function PostFilters({ filters, onChange }: PostFiltersProps) {
  const handleSortChange = (value: string) => {
    onChange({ ...filters, sortBy: value });
  };

  return (
    <div className="space-y-6">
      {/* Sort By */}
      <div>
        <label className="block text-sm font-medium mb-2">Sort By</label>
        <Select value={filters.sortBy} onValueChange={handleSortChange}>
          <SelectTrigger>
            <SelectValue placeholder="Most Recent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="liked">Most Liked</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
