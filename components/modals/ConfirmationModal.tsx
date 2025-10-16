
import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, confirmText = 'OK', cancelText = 'Batal' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300 animate-fadeIn">
            <div className="bg-card text-text rounded-lg shadow-xl p-8 w-11/12 md:w-1/2 text-center animate-modal-appear">
                <div className="mb-8 text-2xl">{title}</div>
                <div className="flex justify-center space-x-6">
                    <button 
                        onClick={onClose} 
                        className="py-3 px-8 rounded-lg text-text-secondary bg-text/10 hover:bg-text/20 font-semibold text-lg"
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className="py-3 px-8 rounded-lg text-header-text bg-primary-dark hover:bg-opacity-90 font-semibold text-lg"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
