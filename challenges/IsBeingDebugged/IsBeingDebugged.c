#include <windows.h>
#include <stdio.h>

int main(int argc, char** argv)
{
    if(IsDebuggerPresent())
    {
        printf("Yes !\n");
    }
    else
    {
        printf("No !\n");
    }

    getchar();
    
    return 0;
}