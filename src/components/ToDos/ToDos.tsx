import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import Input from "../Input/Input";
import Tabs from "../Tabs/Tabs";

const Todos = () => {
    const [tasks, setTasks] = useState([
        { id: '2gh', text: 'Сделать покупки', completed: false },
        { id: '3jb', text: 'Прочитать книгу', completed: true },
    ]);

    const [tab, setTab] = useState('ex1-tabs-1');
    const [renderTasks, setRenderTasks] = useState(tasks);

    const changeTab = (newTab: string) => {
        setTab(newTab);
    };

    const addTask = (text: string) => {
        const newTask = {
            id: uuidv4(),
            text,
            completed: false,
        };
        setTasks([...tasks, newTask]);
    };
    
    const toggleTask = (id: string) => {
        const updatedTasks = tasks.map((task) =>
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        setTasks(updatedTasks);
    };

    const deleteTask = () => {
        const updatedTasks = tasks.filter((task) => !task.completed);
        setTasks(updatedTasks);
    };

    const completedTasks = () => {
       return tasks.filter((task) => !task.completed).length;
    }

    useEffect (() => {
        const render = tab === 'ex1-tabs-1' ? tasks : tab === 'ex1-tabs-2' ? tasks.filter((task) => !task.completed) : tasks.filter((task) => task.completed);
        setRenderTasks(render);
    }, [tab, tasks]);

    return (
        <section className="vh-100 gradient-custom">
            <div className="container py-5 h-100">
                <div className="row d-flex justify-content-center align-items-center h-100">
                    <div className="col col-xl-10">
                        <div className="card">
                            <div className="card-body p-5"><h1>todos</h1> 
                                <Input add={addTask}/>
                                <div className="tab-content" id="ex1-content">
                                    <div className="tab-pane fade show active" id="ex1-tabs-1" role="tabpanel" aria-labelledby="ex1-tab-1">
                                        <ul className="list-group mb-0">
                                            {renderTasks.map((task, index) => (
                                                <li 
                                                    key={index} 
                                                    className="list-group-item d-flex align-items-center border-0 mb-2 rounded" 
                                                    style={{ backgroundColor: '#f4f6f7' }}>
                                                    <input 
                                                        className="form-check-input me-2" 
                                                        type="checkbox" 
                                                        aria-label={`...${task.id}`}  
                                                        checked={task.completed} 
                                                        onChange={() => toggleTask(task.id)} 
                                                    />
                                                    {task.completed ? <s>{task.text}</s> : task.text}
                                                </li>
                                            ))}               
                                        </ul>
                                    </div>
                                </div>
                                <div className="bottom">
                                    <div className="tasks-left">{completedTasks()} {completedTasks() > 1 ? 'items' : 'item'} left</div>
                                    <Tabs tab={tab} toggler={changeTab} />
                                    <button className="deleteBtn" onClick={() => deleteTask()}>Clear completed</button>
                                </div> 
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Todos;