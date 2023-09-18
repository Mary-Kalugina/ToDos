import React from "react";

interface TabsProps {
    toggler: (tabActive: string) => void;
    tab: string;
}

const Tabs: React.FC<TabsProps> = ({ toggler, tab }) => {
    const changeTab = (tabActive: string) => {
        toggler(tabActive);
    };

    return (
        <div className="tab-pane fade" id={tab} role="tabpanel" aria-labelledby={tab}>
            <ul className="nav nav-tabs mb-4 pb-2" id="ex1" role="tablist">
                <li 
                onClick={() => changeTab('ex1-tabs-1')}
                 className={`nav-item`} 
                 role="presentation">
                    <a 
                      className={`nav-link ${tab === 'ex1-tabs-1' ? 'active' : ''}`} 
                      id="ex1-tab-1" 
                      data-mdb-toggle="tab" 
                      href="#ex1-tabs-1" 
                      role="tab"
                      aria-controls="ex1-tabs-1" 
                      aria-selected={tab === 'ex1-tabs-1' ? 'true' : 'false'}
                    >
                      All
                    </a>
                </li>
                <li 
                onClick={() => changeTab('ex1-tabs-2')} 
                className={`nav-item`} 
                role="presentation">
                    <a 
                      className={`nav-link ${tab === 'ex1-tabs-2' ? 'active' : ''}`} 
                      id="ex1-tab-2" 
                      data-mdb-toggle="tab" 
                      href="#ex1-tabs-2" 
                      role="tab"
                      aria-controls="ex1-tabs-2" 
                      aria-selected={tab === 'ex1-tabs-2' ? 'true' : 'false'}
                    >
                      Active
                    </a>
                </li>
                <li 
                onClick={() => changeTab('ex1-tabs-3')} 
                className={`nav-item`} 
                role="presentation">
                    <a 
                      className={`nav-link ${tab === 'ex1-tabs-3' ? 'active' : ''}`} 
                      id="ex1-tab-3" 
                      data-mdb-toggle="tab" 
                      href="#ex1-tabs-3" 
                      role="tab"
                      aria-controls="ex1-tabs-3" 
                      aria-selected={tab === 'ex1-tabs-3' ? 'true' : 'false'}
                    >
                      Completed
                    </a>
                </li>
            </ul>
        </div>
    );
};

export default Tabs;
