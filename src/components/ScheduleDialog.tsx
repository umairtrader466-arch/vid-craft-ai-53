import { useState } from "react";
import { format, addDays, addHours, setHours, setMinutes } from "date-fns";
import { Calendar, Clock, Video, CalendarDays } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ScheduleConfig {
  videosPerDay: number;
  startDate: Date;
  startTime: string;
  hoursBetweenVideos: number;
}

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicsCount: number;
  onConfirm: (config: ScheduleConfig) => void;
}

export function ScheduleDialog({
  open,
  onOpenChange,
  topicsCount,
  onConfirm,
}: ScheduleDialogProps) {
  const [videosPerDay, setVideosPerDay] = useState(1);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState("09:00");
  const [hoursBetweenVideos, setHoursBetweenVideos] = useState(4);

  const totalDays = Math.ceil(topicsCount / videosPerDay);

  const handleConfirm = () => {
    onConfirm({
      videosPerDay,
      startDate,
      startTime,
      hoursBetweenVideos,
    });
  };

  const getSchedulePreview = () => {
    const [hours, minutes] = startTime.split(":").map(Number);
    let baseDate = setMinutes(setHours(startDate, hours), minutes);
    const previews: string[] = [];

    for (let i = 0; i < Math.min(topicsCount, 3); i++) {
      const dayIndex = Math.floor(i / videosPerDay);
      const videoIndexInDay = i % videosPerDay;
      const scheduledTime = addHours(
        addDays(baseDate, dayIndex),
        videoIndexInDay * hoursBetweenVideos
      );
      previews.push(format(scheduledTime, "MMM d, yyyy 'at' h:mm a"));
    }

    return previews;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Schedule Video Publishing
          </DialogTitle>
          <DialogDescription>
            Configure how your {topicsCount} video{topicsCount > 1 ? "s" : ""}{" "}
            will be scheduled for publishing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Videos per day */}
          <div className="space-y-2">
            <Label htmlFor="videosPerDay" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Videos per day
            </Label>
            <Input
              id="videosPerDay"
              type="number"
              min={1}
              max={10}
              value={videosPerDay}
              onChange={(e) => setVideosPerDay(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full"
            />
          </div>

          {/* Start date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Start date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarPicker
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Start time */}
          {/* <div className="space-y-2">
            <Label htmlFor="startTime" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Start time
            </Label>
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full"
            />
          </div> */}

              <div className="space-y-2">
                <Label htmlFor="startTime" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Start time
                </Label>
                <select
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, "0");
                    const label = i === 0 ? "12 AM (Midnight)" : i < 12 ? `${i} AM` : i === 12 ? "12 PM (Noon)" : `${i - 12} PM`;
                    return (
                      <option key={hour} value={`${hour}:00`}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

          {/* Hours between videos */}
          {videosPerDay > 1 && (
            <div className="space-y-2">
              <Label htmlFor="hoursBetween" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Minimum hours between videos
              </Label>
              <Input
                id="hoursBetween"
                type="number"
                min={1}
                max={12}
                value={hoursBetweenVideos}
                onChange={(e) => setHoursBetweenVideos(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full"
              />
            </div>
          )}

          {/* Schedule preview */}
          <div className="rounded-lg bg-muted p-3 space-y-2">
            <p className="text-sm font-medium">Schedule Preview</p>
            <div className="text-xs text-muted-foreground space-y-1">
              {getSchedulePreview().map((preview, i) => (
                <p key={i}>Video {i + 1}: {preview}</p>
              ))}
              {topicsCount > 3 && (
                <p className="text-muted-foreground">...and {topicsCount - 3} more</p>
              )}
            </div>
            <p className="text-xs text-primary mt-2">
              Total duration: {totalDays} day{totalDays > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Confirm & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
