---
title: "From SDL to DX12"
description: "Struggling to understand Direct3D 12 rendering pipeline."
pubDate: 2026-10-15
tags: ["Rendering", "C++", "DX12"]
# cover: "/images/projects/fluid-study.svg"
# coverAlt: "An abstract fluid simulation composed of blue streamlines and a red circle"
# draft: true
---

After completing my midterm on Oct. 14th, I finally have some time to continue my fluid project. For now I am trying to switch the project's displaying architecture from SDL3 to DX12 (Direct3D 12), in a way to adapt my project as a natural windows application while also forcing myself to be more familiar with modern graphics API.

The sample code is downloaded from [DirectX-Graphics-Samples](https://github.com/microsoft/DirectX-Graphics-Samples), which is Microsoft's official repository for DX12 learning. I chose _D3D12HelloWindow_ as my starting point. So let's start now!

# Program Entrance

The `Main.cpp` simply provided an instance of a class inherited from `DXSample` as a start:

```cpp
_Use_decl_annotations // Use previously declared SAL annotations
// This is a Windows sub-system, so we call WinMain() or wWinMain()
int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE, LPSTR, int nCmdShow) {
    // Create a sample instance
    D3D12HelloWindow sample(1280, 720, L"D3D12 Hello Window");
    return Win32Application::Run(&sample, hInstance, nCmdShow);
}
```

`Run()` function takes care of window creation, initialization, event loop, and exit cleanup. First we parse the command line parameters:

```cpp
int argc;
LPWSTR* argv = CommandLineToArgvW(GetCommandLineW(), &argc);
pSample->ParseCommandLineArgs(argv, argc);
LocalFree(argv);
```

Then we initialize the window class, and tell windows to use which function to process window events with a function pointer.
```cpp
WNDCLASSEX windowClass = { 0 };
windowClass.cbSize = sizeof(WNDCLASSEX);
windowClass.style = CS_HREDRAW | CS_VREDRAW;
windowClass.lpfnWndProc = WindowProc; // Which function to use
windowClass.hInstance = hInstance;
windowClass.hCursor = LoadCursor(NULL, IDC_ARROW);
windowClass.lpszClassName = L"DXSampleClass";
RegisterClassEx(&windowClass);
```

After that, we create a window rectangle and create a window:
```cpp
RECT windowRect = { 0, 0, static_cast<LONG>(pSample->GetWidth()), static_cast<LONG>(pSample->GetHeight()) };
AdjustWindowRect(&windowRect, WS_OVERLAPPEDWINDOW, FALSE);
// Create the window and store a handle to it.
m_hwnd = CreateWindow(
    windowClass.lpszClassName,
    pSample->GetTitle(),
    WS_OVERLAPPEDWINDOW,
    CW_USEDEFAULT,
    CW_USEDEFAULT,
    windowRect.right - windowRect.left,
    windowRect.bottom - windowRect.top,
    nullptr,        // We have no parent window.
    nullptr,        // We aren't using menus.
    hInstance,
    pSample);
```

Since we finally got a window, we are free to call our real program for initialization and show the initial result to our screen:
```cpp
pSample->OnInit();
ShowWindow(m_hwnd, nCmdShow);
```

While the program is running, we create a message loop to deal with input, draw, and exit events:

```cpp
MSG msg = {};
while (msg.message != WM_QUIT) {
    // Check the message queue of the thread, if there is then take out and remove
    if (PeekMessage(&msg, NULL, 0, 0, PM_REMOVE)) {
        // Some mesterious character conversion
        TranslateMessage(&msg);
        // Dispatch messages to corresponding process functions, which is previously mentioned `WindowProc()`
        DIspatchMessage(&msg);
    }
}
```

Finally when program quits, we do the preparation before destroying the instance and return the quit message:

```cpp
pSample->OnDestroy();
return static_cast<char>(msg.wParam);
```

The real rendering part is in the function `WindowProc()`'s `WM_PAINT` case, while other cases deal with inputs and destroy message, which would send a `WM_QUIT` to make the message loop stop.

```cpp
case WM_PAINT:
    if (pSample)
    {
        pSample->OnUpdate();
        pSample->OnRender();
    }
    return 0;
case WM_DESTROY:
    PostQuitMessage(0);
    return 0;
```

# Preparation Before Drawing

During the initialization of sample instance, `LoadPipeline()` and `LoadAssets()` are called. We will dive into each of them to see what happens.

## LoadPipeline()

First we encounter a 'factory', which is used for enumerating accessible video cards and creating swapchains connected with various windows.

```cpp
UINT dxgiFactoryFlags = 0;
ComPtr<IDXGIFactory4> factory; // ComPtr is just some smart pointer to manage lifetime of some COM objects
ThrowIfFailed(CreateDXGIFactory2(dxgiFactoryFlags, IID_PPV_ARGS(&factory)));
```

In the following line we would have to choose whether to use CPU or GPU to render. For simplicity we would consider warp device as something related with CPU software rendering, just for now.

```cpp
if (m_useWarpDevice)
{
    ComPtr<IDXGIAdapter> warpAdapter;
    ThrowIfFailed(factory->EnumWarpAdapter(IID_PPV_ARGS(&warpAdapter)));
    ThrowIfFailed(D3D12CreateDevice(
        warpAdapter.Get(),
        D3D_FEATURE_LEVEL_11_0,
        IID_PPV_ARGS(&m_device)
        ));
}
else
{
    ComPtr<IDXGIAdapter1> hardwareAdapter;
    GetHardwareAdapter(factory.Get(), &hardwareAdapter);
    ThrowIfFailed(D3D12CreateDevice(
        hardwareAdapter.Get(),
        D3D_FEATURE_LEVEL_11_0,
        IID_PPV_ARGS(&m_device)
        ));
}
```

If we chose GPU rendering by default, then this `GetHardwareAdapter(...)` basically is finding a usable GPU, after which a D3D12 device object is created for that physical device. 

When we find a device, we then use `m_device` to create a command queue:

```cpp
D3D12_COMMAND_QUEUE_DESC queueDesc = {};
queueDesc.Flags = D3D12_COMMAND_QUEUE_FLAG_NONE;
queueDesc.Type = D3D12_COMMAND_LIST_TYPE_DIRECT;
ThrowIfFailed(m_device->CreateCommandQueue(&queueDesc, IID_PPV_ARGS(&m_commandQueue)));
```

To display something, we must create a swapchain. A swapchain manages a set of image resources used for presentation. A program would choose the current _back buffer_ to draw something, and use _Present()_ to submit it for display. Normally swapchains, such display infra, are created by `factory`.

```cpp
ComPtr<IDXGISwapChain1> swapChain;
ThrowIfFailed(factory->CreateSwapChainForHwnd(
    m_commandQueue.Get(),        // Swap chain needs the queue so that it can force a flush on it.
    Win32Application::GetHwnd(), // get the handle of a window
    &swapChainDesc,
    nullptr,
    nullptr,
    &swapChain
    ));
ThrowIfFailed(factory->MakeWindowAssociation(Win32Application::GetHwnd(), DXGI_MWA_NO_ALT_ENTER));
ThrowIfFailed(swapChain.As(&m_swapChain));
// Select the back buffer index
m_frameIndex = m_swapChain->GetCurrentBackBufferIndex();
```

When it comes to an image resource, DX12 also needs to know: how are we going to use it? Thus we need these concepts to clarify:
- Resource: actual resource that stores pixel data
- View: describes how to access resources
- RTV: Render Target View, which means accessing resource in a way of 'setting this image as color output target'.
- Descriptor: data that stores the description of way of accessing.
- Descriptor heap: a space for saving descriptors.

Here we create a desciptor heap:

```cpp
D3D12_DESCRIPTOR_HEAP_DESC rtvHeapDesc = {};
rtvHeapDesc.NumDescriptors = FrameCount;
rtvHeapDesc.Type = D3D12_DESCRIPTOR_HEAP_TYPE_RTV;
rtvHeapDesc.Flags = D3D12_DESCRIPTOR_HEAP_FLAG_NONE;
ThrowIfFailed(m_device->CreateDescriptorHeap(&rtvHeapDesc, IID_PPV_ARGS(&m_rtvHeap)));
m_rtvDescriptorSize = m_device->GetDescriptorHandleIncrementSize(D3D12_DESCRIPTOR_HEAP_TYPE_RTV); // Only by this can we increment and get the right next descriptor.
```

And we create frame resources:

```cpp
CD3DX12_CPU_DESCRIPTOR_HANDLE rtvHandle(m_rtvHeap->GetCPUDescriptorHandleForHeapStart());
// Create a RTV for each frame.
for (UINT n = 0; n < FrameCount; n++)
{
    ThrowIfFailed(m_swapChain->GetBuffer(n, IID_PPV_ARGS(&m_renderTargets[n])));
    // Create RTV for n-th back buffer and write it to the place indicated by rtvHandle.
    m_device->CreateRenderTargetView(m_renderTargets[n].Get(), nullptr, rtvHandle);
    // Move to the next descriptor socket
    rtvHandle.Offset(1, m_rtvDescriptorSize);
}
```

Finally we need to create command allocator as well, to provide enough space for storing command list.

```cpp
ThrowIfFailed(m_device->CreateCommandAllocator(D3D12_COMMAND_LIST_TYPE_DIRECT, IID_PPV_ARGS(&m_commandAllocator)));
```

## LoadAssets()

Here we create a command list for CPU to record commands, which can later be submitted/queued to GPU for asynchronous execution.

```cpp
ThrowIfFailed(m_device->CreateCommandList(0, D3D12_COMMAND_LIST_TYPE_DIRECT, m_commandAllocator.Get(), nullptr, IID_PPV_ARGS(&m_commandList)));
// Command lists are created in the recording state, but there is nothing
// to record yet. The main loop expects it to be closed, so close it now.
ThrowIfFailed(m_commandList->Close());
```

We may use some 'synchronization objects' to confirm GPU completed its job:

```cpp
ThrowIfFailed(m_device->CreateFence(0, D3D12_FENCE_FLAG_NONE, IID_PPV_ARGS(&m_fence)));
m_fenceValue = 1;
// Create an event handle to use for frame synchronization.
m_fenceEvent = CreateEvent(nullptr, FALSE, FALSE, nullptr);
if (m_fenceEvent == nullptr)
{
    ThrowIfFailed(HRESULT_FROM_WIN32(GetLastError()));
}
```

To use this synchronization object, we may check if `m_fence` reaches some `m_fenceValue`; if not, then set an event, and CPU awaits until the event is triggered:

```cpp
if (m_fence->GetCompletedValue() < target)
{
    // trigger this event when fence reaches target
    m_fence->SetEventOnCompletion(target, m_fenceEvent);
    // CPU waits here until event is triggered
    WaitForSingleObject(m_fenceEvent, INFINITE);
}
```

# Program Running

## OnRender()

This function basically does 3 things:

1. Record the commands.
2. Execute the command list.
3. Present the frame.

### PopulateCommandList()

The core structure of this function can be written as below. Note that a `ResourceBarrier` is needed to convert a resource utility to satisfy specific access or synchronization requirements.

```cpp
allocator.Reset();
commandList.Reset();
Transition(PRESENT, RENDER_TARGET);
ClearRenderTargetView();
Transition(RENDER_TARGET, PRESENT);
commandList.Close();
```

Full code is shown below:

```cpp
ThrowIfFailed(m_commandAllocator->Reset());
// However, when ExecuteCommandList() is called on a particular command 
// list, that command list can then be reset at any time and must be before 
// re-recording.
ThrowIfFailed(m_commandList->Reset(m_commandAllocator.Get(), m_pipelineState.Get()));
// Indicate that the back buffer will be used as a render target.
m_commandList->ResourceBarrier(1, &CD3DX12_RESOURCE_BARRIER::Transition(m_renderTargets[m_frameIndex].Get(), D3D12_RESOURCE_STATE_PRESENT, D3D12_RESOURCE_STATE_RENDER_TARGET));
CD3DX12_CPU_DESCRIPTOR_HANDLE rtvHandle(m_rtvHeap->GetCPUDescriptorHandleForHeapStart(), m_frameIndex, m_rtvDescriptorSize);
// Record commands.
const float clearColor[] = { 0.0f, 0.2f, 0.4f, 1.0f };
m_commandList->ClearRenderTargetView(rtvHandle, clearColor, 0, nullptr);
// Indicate that the back buffer will now be used to present.
m_commandList->ResourceBarrier(1, &CD3DX12_RESOURCE_BARRIER::Transition(m_renderTargets[m_frameIndex].Get(), D3D12_RESOURCE_STATE_RENDER_TARGET, D3D12_RESOURCE_STATE_PRESENT));
ThrowIfFailed(m_commandList->Close());
```

### Execution phase

This part is relatively straightforward. Just execute whatever commands we recorded in the command list.

```cpp
ID3D12CommandList* ppCommandLists[] = { m_commandList.Get() };
m_commandQueue->ExecuteCommandLists(_countof(ppCommandLists), ppCommandLists);
```

### Present and wait

We don't have much to say about present:

```cpp
ThrowIfFailed(m_swapChain->Present(1, 0));
```

But we do need to rememver wait before render completes, because even though we submitted the commands, GPU might be still processsing them. Again we use the synchronization object:

```cpp
const UINT64 fence = m_fenceValue;
// Tells GPU set this m_fence to the UINT64 fence value when finishes
ThrowIfFailed(m_commandQueue->Signal(m_fence.Get(), fence));
m_fenceValue++;

// Wait until the previous frame is finished.
if (m_fence->GetCompletedValue() < fence) // check if GPU finishes job
{   // unfinished: when m_fence reaches fence, call the event
    ThrowIfFailed(m_fence->SetEventOnCompletion(fence, m_fenceEvent));
    // CPU waits for this event
    WaitForSingleObject(m_fenceEvent, INFINITE);
}
// Get the next buffer index for next drawing
m_frameIndex = m_swapChain->GetCurrentBackBufferIndex();
```

# Exiting Program

When exit is called by input, as discussed in the `WindowProc` function, CPU still needs to wait for GPU to complete its job -- the same waiting process as above.

Finally! After such an odyssey, we may draw our first frame done by DX12: a pure blue frame. That's it...

![First Frame by DX12](/images/blogs/first_dx12.png)