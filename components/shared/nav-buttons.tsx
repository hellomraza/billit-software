"use client";
import GstToggleButton from '@/app/(dashboard)/components/gst-toggle-button'
import { usePathname } from 'next/navigation'

const NavButtons = () => {
    const pathname = usePathname();

    // render gst button only in home page
    if (pathname !== "/") return;

    return (
        <>
            <GstToggleButton />
        </>
    )
}

export default NavButtons