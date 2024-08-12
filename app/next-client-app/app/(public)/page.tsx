import Image from "next/image";

export default function Default() {
  return (
    <>
      <div className="relative w-[600x] h-[1000px] ">
        <Image src="/logos/demo.jpeg" alt="demo" fill />
      </div>
    </>
  );
}
