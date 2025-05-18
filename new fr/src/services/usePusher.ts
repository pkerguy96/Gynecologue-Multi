import { useEffect, useRef } from "react";
import { getPusherInstance } from "./pusherInstance";

// The usePusher hook
export const usePusher = (
  channelName: string,
  eventName: string,
  callback: (data: any) => void
): void => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const pusher = getPusherInstance();
    const channel = pusher.subscribe(channelName);

    const wrappedCallback = (data: any) => {
      callbackRef.current(data);
    };
    channel.bind(eventName, wrappedCallback);

    // Cleanup function
    return () => {
      channel.unbind(eventName, wrappedCallback);
      channel.unsubscribe();
    };
  }, [channelName, eventName]);
};
