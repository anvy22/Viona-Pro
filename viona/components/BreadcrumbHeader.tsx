"use client"
import React from 'react'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb"

import { usePathname } from 'next/navigation'
import { MobileSidebar } from './DesktopSidebar'

export const BreadcrumbHeader = () => {
    const pathname = usePathname();
    const paths = pathname === '/' ? [''] : pathname.split('/');

    return (
        <div className='flex items-center justify-between w-full p-4 bg-background border-b md:justify-start'>
            <div className='flex items-center gap-4'>
                <MobileSidebar />
                <Breadcrumb>
                    <BreadcrumbList>
                        {paths.map((path, index) => (
                            <React.Fragment key={index}>
                                <BreadcrumbItem>
                                    <BreadcrumbLink className='capitalize' href={`/${path}`}>
                                        {path === "" ? "Dashboard" : path}
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                {index < paths.length - 1 && <BreadcrumbSeparator />}
                            </React.Fragment>
                        ))}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
        </div>
    )
}