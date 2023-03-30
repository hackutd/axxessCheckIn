import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import Reader from '../components/Reader';
import { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import LoadIcon from '../components/LoadIcon';
import ScanType from '../components/ScanType';
import { useRouter } from 'next/router';

const successStrings = {
  claimed: 'Scan claimed...',
  invalidUser: 'Invalid user...',
  alreadyClaimed: 'User has already claimed...',
  unexpectedError: 'Unexpected error...',
  notCheckedIn: "User hasn't checked in!",
  invalidFormat: 'Invalid hacker tag format...',
};

function getSuccessColor(success: string) {
  if (success === successStrings.claimed) {
    return '#5fde05';
  }
  return '#ff0000';
}

const Home: NextPage = () => {
  // List of scan types fetched from backend
  const [scanTypes, setScanTypes] = useState([]);

  // Flag whether scan-fetching process is completed
  const [scansFetched, setScansFetched] = useState(false);

  // Current scan
  const [currentScan, setCurrentScan] = useState(undefined);
  const [currentScanIdx, setCurrentScanIdx] = useState(-1);

  // Process data from QR code
  const [scanData, setScanData] = useState(undefined);
  const [success, setSuccess] = useState(undefined);

  // CRUD scantypes and use scan
  const [showNewScanForm, setShowNewScanForm] = useState(false);
  const [newScanForm, setNewScanForm] = useState({
    name: '',
    isCheckIn: false,
  });
  const [startScan, setStartScan] = useState(false);

  const [editScan, setEditScan] = useState(false);
  const [currentEditScan, setCurrentEditScan] = useState(undefined);

  const [showDeleteScanDialog, setShowDeleteScanDialog] = useState(false);

  const handleScanClick = (data: any, idx: any) => {
    setCurrentScan(data);
    setCurrentScanIdx(idx);
  };

  const router = useRouter();

  const handleScan = async (data: string) => {
    const query = new URL(`http://localhost:3000/api/scan`);
    fetch(query.toString().replaceAll('http://localhost:3000', ''), {
      mode: 'cors',
      method: 'POST',
      body: JSON.stringify({
        id: data,
        scan: currentScan.name,
      }),
    })
      .then(async (result) => {
        setScanData(data);
        if (result.status === 404) {
          return setSuccess(successStrings.invalidUser);
        } else if (result.status === 201) {
          return setSuccess(successStrings.alreadyClaimed);
        } else if (result.status === 403) {
          return setSuccess(successStrings.notCheckedIn);
        } else if (result.status !== 200) {
          return setSuccess(successStrings.unexpectedError);
        }
        setSuccess(successStrings.claimed);
      })
      .catch((err) => {
        console.log(err);
        setScanData(data);
        setSuccess('Unexpected error...');
      });
  };

  const updateScan = async () => {
    const updatedScanData = { ...currentEditScan };
    try {
      const res = await fetch('/api/scan/update', {
        mode: 'cors',
        method: 'POST',
        body: JSON.stringify({
          scanData: updatedScanData,
        }),
      });
      const data = await res.json();
      if (res.status >= 400) {
        alert(data.msg);
      } else {
        alert(data.msg);
        const newScanTypes = [...scanTypes];
        newScanTypes[currentScanIdx] = updatedScanData;
        setScanTypes(newScanTypes);
        setCurrentScan(updatedScanData);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const createNewScan = async () => {
    try {
      const newScan = {
        ...newScanForm,
        precedence: scanTypes.length,
      };
      let res = await fetch('/api/scan/create', {
        mode: 'cors',
        method: 'POST',
        body: JSON.stringify({
          ...newScanForm,
          precedence: scanTypes.length,
        }),
      });
      let data = await res.json();
      if (res.status >= 400) {
        alert(data.msg);
      } else {
        alert('Scan added');
        setScanTypes((prev) => [...prev, newScan]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const deleteScan = async () => {
    try {
      const res = await fetch('/api/scan/delete', {
        mode: 'cors',
        method: 'POST',
        body: JSON.stringify({
          scanDasta: currentScan,
        }),
      });
      const data = await res.json();
      setShowDeleteScanDialog(false);
      if (res.status >= 400) {
        alert(data.msg);
      } else {
        alert(data.msg);
        const newScanTypes = [...scanTypes];
        newScanTypes.splice(currentScanIdx, 1);
        setScanTypes(newScanTypes);
        setCurrentScan(undefined);
        setCurrentScanIdx(-1);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchScanTypes = () => {
    if (scansFetched) return;
    const query = new URL(`http://localhost:3000/api/scantypes`);
    fetch(query.toString().replaceAll('http://localhost:3000', ''), {
      mode: 'cors',
      method: 'GET',
    })
      .then(async (result) => {
        if (result.status !== 200) {
          return console.error('Fetch failed for scan-types...');
        }
        const data = await result.json();
        setScanTypes(data);
        setScansFetched(true);
      })
      .catch((err) => {
        console.log(err);
      });
  };
  useEffect(() => {
    fetchScanTypes();
  });

  console.log('======');
  console.log(currentScan);
  console.log(scanData);
  console.log('======');

  return (
    <div className="relative flex flex-col flex-grow">
      {currentScan && (
        <Dialog
          open={showDeleteScanDialog}
          onClose={() => setShowDeleteScanDialog(false)}
          className="fixed z-10 inset-0 overflow-y-auto"
        >
          <div className="flex items-center justify-center min-h-screen">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

            <div className="rounded-2xl relative bg-white flex flex-col ljustify-between p-4 max-w-sm mx-auto">
              <Dialog.Title>
                Delete <span className="font-bold">{currentScan.name}</span>
              </Dialog.Title>

              <div className="my-7 flex flex-col gap-y-4">
                <Dialog.Description>
                  This is permanently delete{' '}
                  <span className="font-bold">{currentScan.name}</span>
                </Dialog.Description>
                <p>
                  Are you sure you want to delete this scan? This action cannot
                  be undone.
                </p>
              </div>

              <div className="flex flex-row justify-end gap-x-2">
                <button
                  className="bg-red-400 rounded-lg p-3 hover:bg-red-300"
                  onClick={async () => {
                    await deleteScan();
                  }}
                >
                  Delete
                </button>
                <button
                  className="bg-gray-300 rounded-lg p-3 hover:bg-gray-200"
                  onClick={() => setShowDeleteScanDialog(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
      {showNewScanForm ? (
        <div className="px-6 py-4">
          <button
            className="p-3 rounded-lg border-2 hover:bg-gray-200"
            onClick={() => {
              setShowNewScanForm(false);
            }}
          >
            Back to ScanTypes List
          </button>
          <div className="text-2xl font-black text-center">Add New Scan</div>
          <div className="w-3/5 my-5 mx-auto">
            <input
              className="p-3 rounded-lg w-full border-2"
              type="text"
              name="name"
              value={newScanForm.name}
              onChange={(e) => {
                setNewScanForm((prev) => ({
                  ...prev,
                  name: e.target.value,
                }));
              }}
              placeholder="Enter name of scantype"
            />
            <div className="flex flex-row gap-x-2 items-center my-4">
              <input
                type="checkbox"
                id="isCheckin"
                name="isCheckin"
                checked={newScanForm.isCheckIn}
                onChange={(e) => {
                  setNewScanForm((prev) => ({
                    ...prev,
                    isCheckIn: e.target.checked,
                  }));
                }}
              />
              <h1>Is this for check-in event?</h1>
            </div>
          </div>
          <div className="flex justify-around">
            <button
              className="mx-auto bg-green-300 p-3 rounded-lg font-bold hover:bg-green-200"
              onClick={async () => {
                await createNewScan();
              }}
            >
              Add Scan
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col justify-center top-6">
            <div className="text-2xl font-black text-center">Scan Types</div>
            <div className="flex md:flex-row md:flex-wrap md:justify-center overflow-x-auto mx-2">
              {scansFetched ? (
                scanTypes.map((d, idx) => (
                  <ScanType
                    key={d.name}
                    data={d}
                    name={d.name}
                    onClick={() => handleScanClick(d, idx)}
                  />
                ))
              ) : (
                <div className="w-full flex justify-center">
                  <LoadIcon width={150} height={150} />
                </div>
              )}
            </div>

            {currentScan && (
              <div className="my-6">
                <div className="flex flex-col gap-y-4">
                  <div className="text-center text-xl font-black">
                    {currentScan ? currentScan.name : ''}
                  </div>
                  {startScan ? (
                    <>
                      {currentScan && !scanData ? (
                        <Reader
                          width={200}
                          height={200}
                          callback={handleScan}
                        />
                      ) : (
                        <div />
                      )}

                      {scanData ? (
                        <div
                          className="text-center text-3xl font-black"
                          style={{ color: getSuccessColor(success) }}
                        >
                          {success ?? 'Unexpected error!'}
                        </div>
                      ) : (
                        <div />
                      )}

                      {scanData ? (
                        <div className="flex m-auto items-center justify-center">
                          <div
                            className="w-min-5 m-3 rounded-lg text-center text-lg font-black p-3 bg-green-300 cursor-pointer hover:brightness-125"
                            onClick={() => {
                              setScanData(undefined);
                            }}
                          >
                            Next Scan
                          </div>
                          <div
                            className="w-min-5 m-3 rounded-lg text-center text-lg font-black p-3 bg-green-300 cursor-pointer hover:brightness-125"
                            onClick={() => {
                              setScanData(undefined);
                              setCurrentScan(undefined);
                              setStartScan(false);
                            }}
                          >
                            Done
                          </div>
                        </div>
                      ) : (
                        <div />
                      )}
                    </>
                  ) : editScan ? (
                    <>
                      <div className="px-6 py-4">
                        <div className="w-3/5 my-5 mx-auto">
                          <input
                            className="p-3 rounded-lg w-full border-2"
                            type="text"
                            name="name"
                            value={currentEditScan.name}
                            onChange={(e) => {
                              setCurrentEditScan((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }));
                            }}
                            placeholder="Enter name of scantype"
                          />
                          <div className="flex flex-row gap-x-2 items-center my-4">
                            <input
                              type="checkbox"
                              id="isCheckin"
                              name="isCheckin"
                              checked={currentEditScan.isCheckIn}
                              onChange={(e) => {
                                setCurrentEditScan((prev) => ({
                                  ...prev,
                                  isCheckIn: e.target.checked,
                                }));
                              }}
                            />
                            <h1>Is this for check-in event?</h1>
                          </div>
                        </div>
                        <div className="flex justify-around">
                          <div className="flex flex-row gap-x-3">
                            <button
                              className="bg-green-300 p-3 rounded-lg font-bold hover:bg-green-200"
                              onClick={async () => {
                                await updateScan();
                              }}
                            >
                              Update Scan Info
                            </button>
                            <button
                              className="font-bold p-3 rounded-lg bg-gray-300 hover:bg-gray-200"
                              onClick={() => {
                                setEditScan(false);
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="mx-auto flex flex-row gap-x-4">
                      <button
                        className="font-bold bg-green-300 hover:bg-green-200 rounded-lg md:p-3 p-1 px-2"
                        onClick={() => {
                          setStartScan(true);
                        }}
                      >
                        Start Scan
                      </button>
                      {
                        <>
                          <button
                            className="font-bold bg-gray-300 hover:bg-gray-200 rounded-lg md:p-3 p-1 px-2"
                            onClick={() => {
                              setCurrentEditScan(currentScan);
                              setEditScan(true);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="font-bold bg-red-300 hover:bg-red-200 rounded-lg md:p-3 p-1 px-2"
                            onClick={() => {
                              if (currentScan.isCheckIn) {
                                alert('Check-in scan cannot be deleted');
                                return;
                              }
                              setShowDeleteScanDialog(true);
                            }}
                          >
                            Delete
                          </button>
                        </>
                      }
                      <button
                        className="font-bold bg-red-300 hover:bg-red-200 rounded-lg md:p-3 p-1 px-2"
                        onClick={() => {
                          setCurrentScan(undefined);
                          setCurrentScanIdx(-1);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!currentScan &&
              !editScan &&
              !showDeleteScanDialog &&
              !startScan && (
                <div className="mx-auto my-5 flex flex-col items-center">
                  <button
                    className="bg-green-300 p-3 rounded-lg font-bold hover:bg-green-200"
                    onClick={() => {
                      setShowNewScanForm(true);
                    }}
                  >
                    Add a new Scan
                  </button>
                  <button
                    className="bg-blue-300 p-3 rounded-lg font-bold hover:bg-blue-200 block mt-4"
                    onClick={() => {
                      router.push('/new');
                    }}
                  >
                    REGISTER WALK-INS
                  </button>
                  <button
                    className="bg-red-300 p-3 rounded-lg font-bold hover:bg-red-200 block mt-4"
                    onClick={() => {
                      router.push('/stats');
                    }}
                  >
                    Stats
                  </button>
                </div>
              )}
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
