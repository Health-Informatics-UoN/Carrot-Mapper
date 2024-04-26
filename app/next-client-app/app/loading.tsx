/**
 * Base loading state for the entire app.
 */
export default function Loading() {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4"></div>
    </div>
  );
}
