import React from "react";
import { ContainerPaddingMixin, defaultBorderMixin } from "../styles";
import { gridIcon } from "../icons";
import { Panel } from "../general/Panel";
import { LinedSpace } from "../layout/LinedSpace";
import clsx from "clsx";


function ProFeaturesPanels() {

    const features = [
        { icon: iconDoor, title: 'Users and Roles Management', description: 'Configure app settings according to the logged-in user, and connect with your existing user management system. This feature allows for a seamless integration between your application\'s user base and the management system, ensuring a cohesive experience across your platform.' },
        { icon: gridIcon, title: 'Components reuse', description: 'Use our top-level spreadsheet view to create custom components. This feature is designed to maximize efficiency and streamline your development process by enabling the reuse of components across different parts of your application.' },
        { icon: iconCards, title: 'Self-hosted', description: 'Completely independent, no reliance on third-party services. This allows for full control over your data and infrastructure, ensuring that your application remains secure and operates according to your own standards and regulations.' },
        { icon: iconArrows, title: 'Subcollection Compatibility', description: 'Seamless navigation for collections within other entities. This feature enhances the user experience by providing intuitive navigation and interaction with nested data structures, making complex data more accessible and manageable.' },
        { icon: iconRadar, title: 'Dedicated Support', description: 'Get priority support for your projects, with a dedicated account manager. This ensures that any issues or questions you have are addressed promptly, allowing you to maintain momentum in your development cycle and focus on delivering great products.' },
        { icon: iconStars, title: 'Data enhancement', description: 'Use LLMs to enhance your data with additional information. This cutting-edge feature enables you to enrich your datasets automatically, leveraging large language models to add context, insights, and value to your information, thereby improving the overall quality and utility of your data.' }
    ];

    return (
        <Panel
            color={"white"}
            includePadding={false}>

            <LinedSpace size={"larger"} position={"bottom"}/>
            <div className={ContainerPaddingMixin}>
                <div
                    data-aos="fade-up"
                    className={"flex items-center mb-4 "}>
                    <div>

                        <h2 className="h2 mb-3 uppercase gradient-text">
                            Advanced Functionality, Built-In
                        </h2>

                        <p className={clsx("text-xl md:text-2xl py-4")}>
                            <b>FireCMS PRO</b> allows you to use all the internal components and features of FireCMS,
                            while allowing total styling and customization. It also provides additional tools and
                            components
                            to help you build better back-office applications faster.

                            FireCMS PRO elevates your control and efficiency, offering an unmatched user
                            experience designed for professionals. Seamlessly manage your data with
                            enhanced tools, including an intuitive <strong className={"gradient-text"}>spreadsheet view</strong> and <strong className={"gradient-text"}>dynamic,
                            feature-rich forms</strong>. It's the professional edge
                            your projects demand.
                        </p>
                    </div>

                </div>


                <div className="mx-auto px-4 md:px-8">
                    <table className="w-full text-xl border-none">
                        <tbody>
                        {features.map((feature, index) => (
                            <tr key={index} className={"border-none"}>
                                <td className="text-center border-none">{feature.icon}</td>
                                <td className={"border-none"}>
                                    <div className={"h4"}>{feature.title}</div>
                                    <div className={"text-sm"}>{feature.description}</div>
                                </td>
                                {/*<td className={"text-sm border-none"}>{feature.description}</td>*/}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

            </div>

            <LinedSpace size={"larger"} position={"top"}/>

        </Panel>
    );
}

export default ProFeaturesPanels;

const iconStars = <svg
    className="w-16 h-16 p-1"
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
>
    <g fill="none" fillRule="evenodd">
        <rect
            className="fill-current text-primary"
            width="64"
            height="64"
            rx="32"
        />
        <g strokeWidth="2">
            <path
                className="stroke-current text-white"
                d="M32 37.714A5.714 5.714 0 0037.714 32a5.714 5.714 0 005.715 5.714"
            />
            <path
                className="stroke-current text-white"
                d="M32 37.714a5.714 5.714 0 015.714 5.715 5.714 5.714 0 015.715-5.715M20.571 26.286a5.714 5.714 0 005.715-5.715A5.714 5.714 0 0032 26.286"
            />
            <path
                className="stroke-current text-white"
                d="M20.571 26.286A5.714 5.714 0 0126.286 32 5.714 5.714 0 0132 26.286"
            />
            <path
                className="stroke-current text-blue-300"
                d="M21.714 40h4.572M24 37.714v4.572M37.714 24h4.572M40 21.714v4.572"
                strokeLinecap="square"
            />
        </g>
    </g>
</svg>;

const iconTalking = <svg
    className="w-16 h-16 p-1 "
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
>
    <g fill="none" fillRule="evenodd">
        <rect
            className="fill-current text-primary"
            width="64"
            height="64"
            rx="32"
        />
        <g strokeLinecap="square" strokeWidth="2">
            <path
                className="stroke-current text-blue-300"
                d="M38.826 22.504a9.128 9.128 0 00-13.291-.398M35.403 25.546a4.543 4.543 0 00-6.635-.207"
            />
            <path
                className="stroke-current text-white"
                d="M19.429 25.143A6.857 6.857 0 0126.286 32v1.189L28 37.143l-1.714.571V40A2.286 2.286 0 0124 42.286h-2.286v2.285M44.571 25.143A6.857 6.857 0 0037.714 32v1.189L36 37.143l1.714.571V40A2.286 2.286 0 0040 42.286h2.286v2.285"
            />
        </g>
    </g>
</svg>;

const iconDoor = <svg
    className="w-16 h-16 p-1 "
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
>
    <g fill="none" fillRule="evenodd">
        <rect
            className="fill-current text-primary"
            width="64"
            height="64"
            rx="32"
        />
        <g transform="translate(22.857 19.429)"
           strokeWidth="2">
            <path
                className="stroke-current text-white"
                strokeLinecap="square"
                d="M12.571 4.571V0H0v25.143h12.571V20.57"
            />
            <path
                className="stroke-current text-white"
                d="M16 12.571h8"
            />
            <path
                className="stroke-current text-white"
                strokeLinecap="square"
                d="M19.429 8L24 12.571l-4.571 4.572"
            />
            <circle
                className="stroke-current text-blue-300"
                strokeLinecap="square"
                cx="12.571"
                cy="12.571"
                r="3.429"
            />
        </g>
    </g>
</svg>;
const iconCards = <svg
    className="w-16 h-16 p-1 "
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
>
    <g fill="none" fillRule="evenodd">
        <rect
            className="fill-current text-primary"
            width="64"
            height="64"
            rx="32"
        />
        <g strokeLinecap="square" strokeWidth="2">
            <path
                className="stroke-current text-white"
                d="M20.571 20.571h13.714v17.143H20.571z"
            />
            <path
                className="stroke-current text-blue-300"
                d="M38.858 26.993l6.397 1.73-4.473 16.549-13.24-3.58"
            />
        </g>
    </g>
</svg>;
const iconArrows = <svg
    className="w-16 h-16 p-1 "
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
>
    <g fill="none" fillRule="evenodd">
        <rect
            className="fill-current text-primary"
            width="64"
            height="64"
            rx="32"
        />
        <g strokeWidth="2">
            <path
                className="stroke-current text-blue-300"
                d="M34.514 35.429l2.057 2.285h8M20.571 26.286h5.715l2.057 2.285"
            />
            <path
                className="stroke-current text-white"
                d="M20.571 37.714h5.715L36.57 26.286h8"
            />
            <path
                className="stroke-current text-blue-300"
                strokeLinecap="square"
                d="M41.143 34.286l3.428 3.428-3.428 3.429"
            />
            <path
                className="stroke-current text-white"
                strokeLinecap="square"
                d="M41.143 29.714l3.428-3.428-3.428-3.429"
            />
        </g>
    </g>
</svg>;
const iconRadar = <svg
    className="w-16 h-16 p-1 "
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
>
    <g fill="none" fillRule="evenodd">
        <rect
            className="fill-current text-primary"
            width="64"
            height="64"
            rx="32"
        />
        <g strokeWidth="2"
           transform="translate(19.429 20.571)">
            <circle
                className="stroke-current text-white"
                strokeLinecap="square"
                cx="12.571"
                cy="12.571"
                r="1.143"
            />
            <path
                className="stroke-current text-white"
                d="M19.153 23.267c3.59-2.213 5.99-6.169 5.99-10.696C25.143 5.63 19.514 0 12.57 0 5.63 0 0 5.629 0 12.571c0 4.527 2.4 8.483 5.99 10.696"
            />
            <path
                className="stroke-current text-blue-300"
                d="M16.161 18.406a6.848 6.848 0 003.268-5.835 6.857 6.857 0 00-6.858-6.857 6.857 6.857 0 00-6.857 6.857 6.848 6.848 0 003.268 5.835"
            />
        </g>
    </g>
</svg>;
