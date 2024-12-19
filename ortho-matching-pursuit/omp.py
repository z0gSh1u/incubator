## https://github.com/z0gSh1u/ortho-matching-pursuit

import numpy as np


def ompAlgorithm(D, y, L):
    '''
        D: The dictionary (column vectors as bases).
           Shape: (Feature Dimensions, Bases Count)
        y: The signal to sparse encode.
        L: Iterations count.
    '''
    BasisDim = D.shape[0]
    BasesCount = D.shape[1]
    assert L <= BasesCount

    r = np.array(y, dtype=np.float32)  # the residue of sparse encode
    B = np.array(D, dtype=np.float32)  # bases allow using now
    S = np.zeros((BasisDim, 0), dtype=np.float32)  # selected bases
    SIndices = []  # indices of selected bases in the dictionary

    for _ in range(L):
        p = r.T @ B  # project the residue onto valid bases

        bIndex = np.argmax(np.abs(p))  # the basis with longest projection
        S = np.column_stack((S, B[:, bIndex]))
        SIndices.append(bIndex)  # store
        B[:, bIndex] = 0  # make the selected basis invalid

        # re-compute weights and residue
        alpha = np.linalg.pinv(S) @ y
        r = y - S @ alpha

    Sa = S @ alpha

    return Sa, SIndices, alpha, r


if __name__ == "__main__":
    ## Examples are from Koredianto Usman. Introduction to Orthogonal Matching Pursuit[EB/OL].2017.
    ## https://korediantousman.staff.telkomuniversity.ac.id/files/2017/08/main-1.pdf.

    L = 2

    ## Example 1
    A = np.array([
        [-0.707, 0.8, 0],
        [0.707, 0.6, -1],
    ])
    y = np.array([1.65, -0.25]).T

    ## Example 2
    # A = np.array([
    #     [-0.9428, 0.268, 0.9535, 0.4082],
    #     [-0.2357, 0.3578, -0.286, -0.4082],
    #     [0.2357, 0.894, -0.0953, -0.8165],
    # ])
    # y = np.array([2.7, 0.1, 4.5]).T

    Sa, SIndices, alpha, r = ompAlgorithm(A, y, L)
    print('Sa\n', Sa, '\nSIndices\n', SIndices, '\nalpha\n', alpha, '\nr\n', r.sum())
